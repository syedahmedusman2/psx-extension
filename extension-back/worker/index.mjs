const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

export async function previousClose(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error('Previous close is not configured');
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/closing_day_data?select=closing_point&order=created_at.desc&limit=1`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Previous close unavailable');
  const rows = await response.json();
  const value = Number(rows[0]?.closing_point);
  if (!Number.isFinite(value) || value <= 0) throw new Error('Previous close unavailable');
  return value;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === '/health') return json({ status: 'ok' });
    const stock = path.match(/^\/stock\/([A-Za-z0-9.-]{1,20})$/);
    if (!stock && !['/kse100', '/getSymbols', '/getPreviousClose'].includes(path)) return json({ error: 'Not found' }, 404);
    // Ignore query strings to avoid creating duplicate cache entries.
    const key = new Request(`${url.origin}${path}`);
    const cache = caches.default;
    const cached = await cache.match(key);
    if (cached) return cached;
    try {
      let body;
      if (path === '/getPreviousClose') body = { closing_point: await previousClose(env) };
      else {
        const upstream = path === '/getSymbols' ? 'symbols' : `timeseries/int/${stock ? stock[1].toUpperCase() : 'KSE100'}`;
        // Match the request header used by PSX's public frontend.
        const homepage = await fetch(`https://dps.psx.com.pk/?pulse=${Date.now()}`, { cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(10000) });
        if (!homepage.ok) throw new Error(`PSX homepage unavailable (${homepage.status})`);
        const html = await homepage.text();
        const requestId = html.match(/"_k"\s*:\s*"([^"\n]+)"/)?.[1];
        const response = await fetch(`https://dps.psx.com.pk/${upstream}`, {
          headers: { ...(requestId ? { 'X-Req-Id': requestId } : {}), 'X-Requested-With': 'XMLHttpRequest', Referer: 'https://dps.psx.com.pk/' },
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) throw new Error(`PSX data unavailable (${response.status})`);
        body = await response.json();
        if (path === '/kse100') {
          // Quotes remain available if the optional closing-price database is down.
          body.previousClose = await previousClose(env).catch(() => null);
        }
      }
      const result = json(body);
      result.headers.set('Cache-Control', `public, max-age=${path === '/getSymbols' ? 86400 : 60}`);
      ctx.waitUntil(cache.put(key, result.clone()));
      return result;
    } catch (error) {
      return json({ error: 'Market data temporarily unavailable. Please retry.', source: /^PSX /.test(error.message) ? error.message : 'Upstream request failed' }, 502);
    }
  }
};
