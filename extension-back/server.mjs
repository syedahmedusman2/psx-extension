import http from 'node:http';
import { pathToFileURL } from 'node:url';
import worker from './worker/index.mjs';

// The same API runs on Node hosts and Workers; Node uses a bounded memory cache.
export function createCache(now = Date.now) {
  const entries = new Map();
  return {
    async match(request) {
      const entry = entries.get(request.url);
      if (!entry) return;
      if (entry.expires <= now()) { entries.delete(request.url); return; }
      return new Response(entry.body, { status: entry.status, headers: entry.headers });
    },
    async put(request, response) {
      const ttl = Number(response.headers.get('Cache-Control')?.match(/max-age=(\d+)/)?.[1] || 0);
      if (!ttl) return;
      const body = await response.text();
      if (entries.size >= 500) entries.delete(entries.keys().next().value);
      entries.set(request.url, { body, status: response.status, headers: [...response.headers], expires: now() + ttl * 1000 });
    }
  };
}

export function createServer(env = process.env) {
  globalThis.caches = { default: createCache() };
  return http.createServer(async (req, res) => {
    try {
      const request = new Request(new URL(req.url, 'http://localhost'), { method: req.method });
      const response = await worker.fetch(request, env, { waitUntil(promise) { promise.catch(console.error); } });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: 'Request failed' }));
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createServer();
  server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('PSX Pulse API ready'));
  process.on('SIGTERM', () => server.close());
}
