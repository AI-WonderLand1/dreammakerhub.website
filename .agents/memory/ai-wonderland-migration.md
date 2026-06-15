---
name: AI Wonderland migration
description: How Supabase was replaced with Replit Auth + Replit PostgreSQL in this Next.js 16 monorepo
---

## Central adapter pattern
All 100+ server-side files import `createClient()` from `@/app/utils/supabase/server`.
That file was rewritten to read `x-replit-user-id` / `x-replit-user-name` headers and return
a Supabase-compatible interface backed by `pg.Pool` (DATABASE_URL from Replit env).

**Why:** Touching all 100+ callers would be fragile; swapping one file is safe.

## Key files
- `apps/web/app/utils/supabase/server.ts` — the central Replit adapter (DO NOT restore Supabase here)
- `apps/web/utils/supabase/server.ts` — re-exports from above
- `apps/web/lib/supabase/auth-context.tsx` — client-side auth context (polls /api/auth/session)
- `apps/web/lib/supabase/client.ts` — stubbed (returns null)
- `apps/web/lib/db.ts` — pg.Pool helper using DATABASE_URL
- `apps/web/lib/replitAuth.ts` — server-side Replit user helper
- `apps/web/app/api/auth/session/route.ts` — reads x-replit-user-id headers
- `apps/web/app/api/auth/replit-login/route.ts` — Replit login page

## Run setup
- Monorepo at apps/web/, npm workspaces, Next.js hoisted to root node_modules/
- Run: `cd apps/web && PORT=5000 npm run dev` → calls scripts/run-dev.mjs
- run-dev.mjs uses createRequire to find next/dist/bin/next from root
- Port 5000 → external 80

**Why:** Next.js is NOT in apps/web/node_modules — it's at the root. The run-dev.mjs script handles this.

## Supabase env vars
NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are still present in env but
all code paths that used them have been stubbed/replaced. They are harmless.
