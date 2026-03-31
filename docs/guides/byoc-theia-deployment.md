# BYOC Theia Deployment Blueprint

This guide implements a production-ready pattern for customer-isolated IDE infrastructure.

## 1) Dockerize Theia with BYOC and Colyseus tooling

`WonderSpace/Dockerfile` now bakes runtime tooling so each tenant container can run SDK-based workflows:

- `colyseus.js` (tenant presence/session channels)
- `@supabase/supabase-js` (asset sync script)
- `supabase_mount.mjs` helper script copied into `/home/theia/bin`

## 2) Supabase mount script inside Theia

Use the bundled script in a running Theia container:

```bash
node /home/theia/bin/supabase_mount.mjs
```

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`

Optional:

- `SUPABASE_PREFIX`
- `SUPABASE_MOUNT_DIR` (default `/home/theia/workspace/supabase`)

The script pulls objects from Supabase Storage and writes them into the mounted folder so the IDE sees files locally.

## 3) Tenant-aware ide.yourdomain.com proxy (Vercel + Next route)

Use `vercel.json` host rewrite to forward traffic from `ide.yourdomain.com` to Next.js proxy route:

- Host rewrite: `/:path*` -> `/api/tenant-ide-proxy/:path*`
- Proxy route resolves tenant from host subdomain and forwards to the configured Theia upstream.

Set tenant upstream map in `TENANT_THEIA_MAP` as JSON:

```json
{
  "acme": "https://acme-theia.internal.example.com",
  "globex": "https://globex-theia.internal.example.com"
}
```

## Security notes

- Keep Theia upstreams on private networks or authenticated gateways.
- Use per-tenant short-lived credentials for storage operations.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser clients.

## Minimal threat model for BYOC credentials

- **Token leakage risk:** credential material can leak via logs, browser storage, error traces, or accidental plaintext DB writes. Mitigation in this repo: credentials are submitted to server routes and stored only as encrypted payloads plus non-sensitive metadata (for example last4 markers), never plaintext.
- **Rotation:** API keys and service-account secrets should be rotated on a fixed cadence and immediately after suspicion of compromise. Reconnect flows should be used to refresh encrypted payloads and record new `connected_at` / `last_reconnected_at` timestamps.
- **Revocation:** when compromise is suspected, first revoke provider credentials in the cloud vendor console, then disconnect the BYOC record in-app so `disconnected_at` is auditable and downstream jobs stop using stale credentials.
