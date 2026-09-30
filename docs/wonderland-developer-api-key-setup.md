# Wonderland developer API-key foundation

This PR adds private, owner-scoped customer API-key storage and reuses existing Supabase login. It does **not** enable publicly billable generation yet.

## Setup (after review)
1. Review and apply `supabase/migrations/20260929230000_wonderland_api_keys.sql` to the active DreamMakerHub Supabase project via the normal deployment/migration process. Do not run against unrelated projects.
2. Ensure the **server-only** runtime has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`. Never add secret keys to `NEXT_PUBLIC_*` variables, browser bundles, Gradio, or logs.
3. Optional `WONDER_API_KEY_PREFIX=wl_live` (without trailing underscore). Use a separate prefix for test/production environments.
4. Authenticated users can GET or POST `/api/keys`; POST a JSON object `{"name":"development"}`. The raw key is shown once; later GET returns metadata only. DELETE `/api/keys/{id}` revokes only the owning user's key. Legacy `/api/keys/api` forwards to the same implementation.
5. A future metered route can call `authenticateWonderlandKey(request.headers.get("authorization"))`, then **atomically** enforce credits/rate limits and reserve GPU budget before dispatch. Never expose a raw Supabase service key to the HF Space.

## Security gates before selling
- No metered 3D job endpoint or reliable GPU capacity is implemented here. Use server-side billing/quota enforcement before enabling consumer traffic.
- `agent/api/main.py` also contains an older unauthenticated `/api/keys/create` route using a separate local key database. Do not expose that service publicly without hardening/removing that legacy creation route.
- The five-active-keys check is a convenience guard and is not transactional under concurrent creation. Add a database-enforced or transactional limit before allowing unrestricted external key creation.
- Test owner isolation, revocation, missing service credentials, token hash matching, and rate limits in staging. Check JWT/session flow with live configured environment; no production records are modified by this PR.
- Hunyuan3D licensing, customer-territory controls and privacy disclosures must be resolved before enabling resale.
