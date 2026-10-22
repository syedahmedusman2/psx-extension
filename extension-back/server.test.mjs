import test from 'node:test';
import assert from 'node:assert/strict';
import { createCache, createServer } from './server.mjs';

test('memory cache clones responses and expires entries', async () => {
  let now = 0;
  const cache = createCache(() => now);
  const request = new Request('https://example.com/kse100');
  await cache.put(request, new Response('quote', { headers: { 'Cache-Control': 'public, max-age=60' } }));
  assert.equal(await (await cache.match(request)).text(), 'quote');
  assert.equal(await (await cache.match(request)).text(), 'quote');
  now = 60000;
  assert.equal(await cache.match(request), undefined);
});

test('Node server handles health, unknown routes and preflight', async () => {
  const server = createServer({});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.deepEqual(await (await fetch(`${base}/health`)).json(), { status: 'ok' });
    assert.equal((await fetch(`${base}/unknown`)).status, 404);
    const preflight = await fetch(`${base}/kse100`, { method: 'OPTIONS' });
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), '*');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
