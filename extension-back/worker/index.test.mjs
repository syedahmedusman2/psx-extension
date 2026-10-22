import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.mjs';

test('health, method and route validation do not call upstream', async () => {
  for (const [path, method, status] of [['/health','GET',200], ['/stock/INVALID!','GET',404], ['/kse100','POST',405], ['/kse100','OPTIONS',200]]) {
    const response = await worker.fetch(new Request(`https://example.com${path}`, { method }), {}, {});
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  }
});

test('quotes survive missing database configuration and are cached', async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  let cached;
  const pending = [];
  globalThis.caches = { default: { match: async () => undefined, put: async (_, response) => { cached = response; } } };
  globalThis.fetch = async (url, options) => {
    if (url.startsWith('https://dps.psx.com.pk/?pulse=')) return new Response('<script>var __ps={"_k":"test-request"}</script>');
    assert.equal(options.headers['X-Req-Id'], 'test-request');
    return Response.json({ data: [[123, 100]] });
  };
  try {
    const response = await worker.fetch(new Request('https://example.com/kse100'), {}, { waitUntil: p => pending.push(p) });
    assert.deepEqual(await response.json(), { data: [[123, 100]], previousClose: null });
    await Promise.all(pending);
    assert.equal(cached.headers.get('Cache-Control'), 'public, max-age=60');
    globalThis.fetch = async () => { throw new Error('offline'); };
    const failure = await worker.fetch(new Request('https://example.com/getSymbols'), {}, { waitUntil() {} });
    assert.equal(failure.status, 502);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.caches = originalCaches;
  }
});
