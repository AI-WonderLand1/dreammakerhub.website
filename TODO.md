# DreamMakerHub - Active TODO

## Completed

### Critical Fixes
- [x] **`apps/web/lib/workspace/`** — Exports `provisionWorkspace`, `terminateWorkspace`, `getWorkspaceStatus`, `listUserWorkspaces`, `getWorkspaceUrls`, `WorkspaceType`. Dockerode-based with graceful fallback.
- [x] **Fix `runners/authWorker.ts`** — Replaced `next-auth/jwt` (not installed) with Supabase auth. Created `lib/env.ts` and `lib/logger.ts`.

### Deployment (dreammakerhub.website)
- [x] **Dockerfile.editor** — Rewrote for monorepo (pnpm, standalone output)
- [x] **deploy.sh** — Full deploy script
- [x] **docker-compose.yml** — Local dev
- [x] **`.env.example`** — Updated with dreammakerhub.website domain
- [x] **`next.config.js`** — Added `output: 'standalone'` for Docker

### Architecture
```
dreammakerhub.website          → Vercel (Next.js web app)
```

---

## TODO — Code Fixes Remaining

- [ ] **Real agent implementation** — Replace mock tools in `my-agent/agent.ts` with actual Supabase calls
- [ ] **Real runner implementation** — `runners/aiWorker.ts` is a stub returning hardcoded data

## TODO — Features (Implementation Plan)

- [ ] **Phase 1**: AI Builder → Puck (enhance AI chat to output Puck JSON)
- [ ] **Phase 4**: Git operations panel — commit/push/pull/sync API + UI
- [ ] **Phase 6**: Temp storage + 24hr warning modal
- [ ] **Phase 7**: BYOC integration (existing `lib/crypto/byoc.ts` + `StorageManager.ts`)
- [ ] **Phase 8**: Deploy & preview URLs

## Key Files Reference

| File | Purpose |
|------|---------|
| `Dockerfile.editor` | Next.js web app image |
| `deploy.sh` | Deploy script |
| `apps/web/lib/workspace/provisioner.ts` | Docker workspace provisioning logic |
| `.env.example` | All env vars (domain, Supabase, AI keys, OCI) |