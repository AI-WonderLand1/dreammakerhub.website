# AI Wonderland - Active TODO

## Critical Fixes (DONE)

- [x] **`apps/web/lib/workspace/`** — Already exists with `provisionWorkspace`, `terminateWorkspace`, `getWorkspaceStatus`, `listUserWorkspaces`, `getWorkspaceUrls`, and `WorkspaceType` type. Dockerode-based with graceful fallback when Docker unavailable.
- [x] **Fix `Dockerfile.workspace` line 28** — Changed `ώξformulahendry.auto-rename-tag` → `formulahendry.auto-rename-tag`.
- [x] **Fix `runners/authWorker.ts`** — Replaced `next-auth/jwt` (not installed) with Supabase auth. Created root `lib/env.ts` and `lib/logger.ts` shims so `../lib/env` and `../lib/logger` resolve properly.
- [x] **Create Coder IDE settings page** — `dashboard/settings/coder/page.tsx` with workspace provisioning, listing, and termination. Added nav links in SettingsMenu, settings layout tabs, global settings sidebar, and overview card.

## OCI Deployment (DONE)

- [x] **Fix `Dockerfile.editor`** — Rewrote for monorepo (pnpm, correct paths, standalone output). Uses multi-stage build.
- [x] **`deploy/k8s/`** — Kubernetes manifests: namespace, configmap, secret, web deployment, workspace deployment, ingress (with TLS + wildcard).
- [x] **`deploy.sh`** — OCI build/push/deploy script. `OCI_REGISTRY=iad.ocir.io/your-tenancy/wonderspace ./deploy.sh all`
- [x] **`docker-compose.yml`** — Local dev with `docker compose up` (web + workspace).
- [x] **`pnpm-workspace.yaml`** — Proper workspace config for pnpm.
- [x] **`.env.example`** — Updated with OCI/Oracle Cloud vars.
- [x] **`next.config.js`** — Added `output: 'standalone'` for Docker builds.

## Next Steps

- [ ] Set `OCI_REGISTRY` env var with your Oracle container registry
- [ ] Update `deploy/k8s/secret.yaml` with real credentials
- [ ] Update `deploy/k8s/configmap.yaml` with your domain
- [ ] Run `./deploy.sh all` from Oracle Cloud shell or CI
- [ ] Real agent implementation — Replace mock tools in `my-agent/agent.ts` with actual Supabase/Docker calls.
- [ ] Real runner implementation — `runners/aiWorker.ts` is a stub returning hardcoded data.
- [ ] Coder IDE template — Add `templates/ide/` with starter workspace configs.

## Features (Implementation Plan)

- [ ] **Phase 1**: AI Builder → Puck (enhance AI chat to output Puck JSON)
- [ ] **Phase 3**: Coder settings connection flow (`lib/coder/connection.ts`)
- [ ] **Phase 4**: Git operations panel — commit/push/pull/sync API + UI
- [ ] **Phase 6**: Temp storage + 24hr warning modal
- [ ] **Phase 7**: BYOC integration (existing `lib/crypto/byoc.ts` + `StorageManager.ts`)
- [ ] **Phase 8**: Deploy & preview URLs

## Testing & Docs

- [ ] Write integration tests for environment provisioning flow
- [ ] API documentation for environment endpoints
- [ ] Troubleshooting guides for common issues