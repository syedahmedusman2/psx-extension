# PSX Pulse

Chrome extension for KSE-100, a three-stock watchlist and one-shot price alerts.

## Deployment status (22 October 2026)

Worker deployed at https://psx-pulse-api.rapideax.workers.dev.
Health and Supabase previous-close checks pass. PSX JSON requests return 404
from Cloudflare even with the public site's request headers and a fresh
homepage request; equivalent local requests succeed. Migration is incomplete.
The extension still points at Vercel. Do not switch it to this Worker until
quote and symbol endpoints pass live checks. A different hosting provider
must be tested for PSX connectivity before cutover.

## Render deployment

`render.yaml` defines a Free Node web service with no paid resources. The Node
adapter uses the same API implementation and a bounded in-memory cache.

1. Push the deployment files to the connected GitHub repository.
2. In Render, create a Blueprint from the repository and select the branch
   containing `render.yaml`.
3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the existing project values.
4. Deploy, then verify `/health`, `/getSymbols`, `/kse100`, and `/stock/HBL`
   on the actual Render URL before changing `PSX_API_BASE` in `config.js`.
5. Reload the extension or publish the updated extension package.

Free Render services sleep after 15 minutes without inbound traffic and may
need about a minute to wake. The popup's 15-second timeout may require reopening
it after a cold start. Live PSX access from Render remains unverified until deployment.

Run `cd extension-back && npm test` for Worker and Node adapter tests.

## Cloudflare deployment reference

The new dependency-free Worker preserves `/kse100`, `/stock/:symbol`,
`/getSymbols` and `/getPreviousClose`. Quote responses are cached for 60 seconds
and symbols for a day. Cache hits still count as Worker requests.

1. Create/sign in to a Cloudflare account and select the Workers Free plan.
2. In `extension-back`, run `npx wrangler login`.
3. Configure the existing Supabase project (keep the current closing-price writer running):
   - `npx wrangler secret put SUPABASE_URL`
   - `npx wrangler secret put SUPABASE_ANON_KEY`
   Use the URL and anon key from your Supabase dashboard. Ensure the table's
   row-level security permits only the intended public read access. Never use a service-role key.
4. Run `npx wrangler deploy` from `extension-back`.
5. Open the printed URL plus `/health`, `/kse100` and `/getSymbols` to verify
   deployment and PSX access from Cloudflare.
6. Set `PSX_API_BASE` in `extension-front/config.js` to that Workers URL (no trailing slash).
7. Reload the unpacked extension in `chrome://extensions`, or package and publish
   an updated Chrome Web Store version for existing users.

The extension keeps the existing Vercel URL until step 6 so a nonexistent
Workers address is never shipped. The original Express/Vercel backend remains
available for rollback. A custom API domain also needs its host permission
added to `manifest.json`.

Previous close is optional for quotes: if Supabase is unavailable, the Worker
returns `previousClose: null`. Percentage changes must not be shown without a
valid baseline. `/getPreviousClose` returns 502 when its source is unavailable.
Caching reduces PSX/database traffic, not incoming Worker invocation counts.
Free hosting has quotas; monitor Cloudflare usage before Vercel is retired.

## Reliability improvements

- One API configuration shared by popup and background worker; request timeouts.
- Explicit Chrome host permissions for Vercel and Workers.
- Background polling uses Pakistan time and skips weekends; the broad 09:00–16:50
  window does not model exchange holidays or Friday breaks.
- New alerts infer above/below from the current price and clear after triggering.
  Existing positive numeric alerts retain their above-target behavior.
- Failed stock fetches display an unavailable message instead of crashing cards.

## Checks

Run `node --test extension-back/worker/index.test.mjs`.
Manually load `extension-front` as an unpacked extension and verify search,
watchlist persistence, alerts, badge, and chart against the deployed endpoint.
Live Cloudflare/PSX connectivity must be verified after account deployment.
