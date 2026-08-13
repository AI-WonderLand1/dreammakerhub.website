# DreamMakerHub Repository Review

**Date:** 2026-08-13
**Repo:** `dreammakerhub.website` (npm monorepo `ai-wonderland`, private, ~4,627 tracked source files, 2307 commits)
**Scope:** Full analysis of all directories, config, CI, database, and infrastructure.

---

## 1. What this repo is

An AI-powered website / 3D-scene / game builder platform (Next.js 16, React 19, Supabase, Prisma, PlayCanvas, Three.js, WebContainer). The active product surface is:
- **`apps/web`** — Next.js app on port 5000: 415 route files incl. **167 `api/**/route.ts`** routes
- **`packages/*`** — 8 shared packages (only `@wonder/perf-assets` is genuinely consumed by the app)
- **`engine/`** — runtime engine (AI orchestration, aetherguard, playground, NPC sim, scene adapters) imported via tsconfig aliases `@core/*`
- **`templates/`** — JSON scene/UI templates read at runtime
- **`infra/`, `deploy/`, `scripts/`, `runners/`, `supabase/`** — ops layer

Everything else at the root is orphaned/archived work (see §6).

---

## 2. Directory-by-directory summary

| Area | Files | Status | Role |
|---|---|---|---|
| `apps/web/` | 2,951 | **ACTIVE** | Next.js app + API (`(builder)`, `(workspace)`, `(public)` route groups + flat `api/`) |
| `packages/` | 1,947* | **ACTIVE** | aiw-cli, coder-workspace, gesture-engine, ide-engine, optimizer, perf-assets, playground-sync, wonder-runtime |
| `engine/` | 115 | **ACTIVE** (alias-imported) | AI providers, aetherguard, playground runner, NPC sim, adapters |
| `infra/` | 44 | **ACTIVE** | Coder/IDE k8s, optimizer + wonder-runtime Deployments, TS service layer |
| `deploy/` | 18 | Active (drift) | Civo (IDEs) + AWS EC2/nginx/pm2 (website); some manifests reference missing files |
| `scripts/` | 22 | Active | CI gates, registry sync, migrations, seeds (swarm decommissioned) |
| `runners/` | 6 | Active | aiWorker, authWorker, aetherguardWorker, fileworkers etc. |
| `supabase/` | 22 | Active | 19 SQL migrations + 2 Edge Functions |
| `docs/` | 707 | Generated/archived | 689 TypeDoc HTML files committed |
| `templates/` | 12 | **ACTIVE** (data) | Scene/UI JSON templates |
| `public/` | 282 | Stale/orphaned | Duplicated media + vendored `litefilesystem.js-master/` |
| `my-agent/` | 30,786* | Orphaned | 99.9% node_modules; mock Google ADK experiment, 0 refs |
| `agent/` | 29 | Semi-active/legacy | Python FastAPI satellite; only dormant `alice-proxy.ts` references it |
| `coder/` | 8 | Orphaned dup | Stale copy of `packages/ide-engine` |
| `spatial-platform/` | 143 | Orphaned | Parallel abandoned monorepo, superseded by `engine/core/adapters/spatial/` |
| `npc-sim/` | 23 | Orphaned | Standalone Hono/drizzle service, superseded by in-app NPC |
| `wp-content/`, `content/`, `custom-engine/` | ~35 | Orphaned | WordPress scratch, docs copy, vendored engine prototype |

\* mostly node_modules

---

## 3. Security findings

### Critical
1. **Legacy keys live on disk & one in git history.**
   - `apps/web/.env` and `apps/web/.env.production` contain a **Supabase `service_role` JWT** (HS256, `iss: supabase`, `role: service_role`, signed 2026-03-16) and an **OpenRouter key `sk-or-v1-…`**, both **verified live against the providers** (Supabase PostgREST `404 PGRST202` = auth passed; OpenRouter `GET /api/v1/key` = 200 with key label). Not fake, not revoked.
   - `OPENCODE_API_KEY` (real, 67 chars) was committed in git history (`b48afb57`, `b9e43e60` `.env`) and remains retrievable.
   - `STRIPE_SECRET_KEY` in `.env` is actually a `pk_live_…` publishable key (mislabeled).
   - **Status as of writing:** user reports new Supabase JWT-signing keys issued; legacy keys should be disabled/rotated in the dashboard to actually stop working. The OpenRouter key remains live. Git-history scrub not performed.
2. **Cross-user data leaks** (missing `.eq("user_id", …)`/ownership checks) on service-role-backed routes:
   - `app/api/keys/api/route.ts:26-30` — GET lists **all users'** API keys; `api/keys/[id]`, `api/secrets/[id]` DELETE with no ownership filter.
   - `app/api/extensions/route.ts` + `extensions/validate` — arbitrary bodies forwarded to Supabase functions with service-role key, no auth.
   - `app/api/ghost/[ghostId]/route.ts` — enumerates all users' storage dirs.
   - `app/api/storage/recovery/route.ts` — arbitrary bucket/path listing, no auth.
   - `app/api/scenes/assets/**` — service-role list/download of `3d-assets` bucket.
3. **Unauthenticated state-changing/billing routes:** `api/stripe/connect/{create-account,provision,subscribe}` (hardcoded fake phone/IP/country), `api/builder/generate`, `api/builder/canvas`, `api/convai/chat` (unbounded in-memory Map), `api/checkout/entitle` (flips `publishEnabled` on arbitrary project).
4. **Smoke-auth impersonation:** `lib/smokeAuth.ts:39-56` — `x-smoke-user-id` header impersonates any user across ~20 routes (prod-guarded on paper only).

### High
5. **SSRF guard bypassable** — `engine/core/ai/providers/ssrf.ts:7-16` substring hostname match, no DNS resolution; not applied to `n8n`, `dreammakerhub`, `alice-proxy` providers.
6. **`vm` sandbox as security boundary** — `engine/core/runners/vm2Runner.ts` (misnamed; Node `vm` is not a security boundary) runs fetched/decrypted code; `engine/core/plugins/extensionManager.ts:21-35` raw `runInContext`.
7. **CI lets LLM write files & run tests** — `.github/scripts/ai-remediate.mjs`; `auto-remediate.yml` calls `predict-risk.mjs` but file is named `perdict-risk.mjs` (job fails).
8. **Insecure container defaults** — root `Dockerfile`/`Dockerfile.webapp` run as root, ship whole monorepo `node_modules`, `rm -f package-lock.json`; `deploy/fix-access.sh` opens ufw **5000/tcp worldwide**; Coder templates use `code-server --auth none` + `curl | sh`; `deploy/k8s/ide-deployment.yaml` hardcodes `CODER_SESSION_TOKEN: "CHANGE_ME"`; `deploy/k8s/web-deployment.yaml` runs stock `node:22-alpine` from PVC instead of a built image.
9. **XSS vectors** — `api/builder/export` renders user HTML via `dangerouslySetInnerHTML`; builder renderers (`lib/builder/renderers/typography.tsx`, `utility.tsx`, `media.tsx`) inject `el.props.html` unsanitized.
10. **Arbitrary local file read** — `api/scenes/[sceneId]/route.ts` `path.join(templatesDir, sceneId + ".json")` with raw user input when the scene isn't in DB.

---

## 4. Bugs & dead/stub code

- `api/spatial/upload/route.ts:35` — typo `smakeUserId` → `ReferenceError` when user is null.
- `engine/core/aetherguard/analyzer.ts:52` — references undefined `DEFAULT_MODE` → runtime crash.
- Two incompatible `runModel` conventions — `pipeline-v1` splits on `:`, main `runModel` on `/`; one unreachable at runtime.
- `packages/wonder-runtime/src/server.js:242-244` — `writeFileSync(dir)` where `mkdirSync` needed (writes a file where a directory is required).
- `components/index.ts:14` — barrel exports `TheiaIDEEngine` from nonexistent file (broken export).
- `app/ai-modules/page.tsx:129` — fetches `/runners/aiWorker` (route doesn't exist).
- Auth stubs: `register` always rejects, `refresh` hard-401, `callback` just redirects, `reset-password`/`verify-email` fake responses.
- In-memory stores lost on restart: convai history, templates, scene versions, webhook dispatch (never delivers). In-memory `convai/chat` unbounded.
- `engine/core/projects/*` and `core/*` `runModel`/`checkTypeScript` non-functional stubs.

---

## 5. Redundancy / tech debt

- 6+ Supabase client factories; 4 auth paths; 2 DB stacks (pg Pool `lib/db.ts` + Prisma + raw `CREATE TABLE` in `lib/projects/storage.ts`); 4 crypto helpers; 3 overlapping memory/AI services; 2 SSRF guards (one weak, one robust — use `lib/ssrf-safe-fetch.node.ts` everywhere).
- Supabase migrations that would fail on a fresh DB: 007 references nonexistent `profiles.role`; 008 policies use `projects.user_id` vs actual `owner_id`; raw seeds + `cron.schedule` without guards.
- Prisma stores `secret_value` in plaintext (`prisma/schema.prisma`).
- ~81 MB Terraform provider binaries committed (`infra/coder/template/.terraform/providers/`).
- Committed artifacts: 13 `.pyc` in `agent/`, `npc-sim/local.db`, `docs/api/` generated HTML, `apps/web/tsconfig.tsbuildinfo`, root `apps/web/.next` in working tree.
- ~175 MB duplicated binaries: 28 MB robot `.glb` ×3 + copies, ~33 MB MP4s at root, images duplicated across root ↔ `apps/web/public/images/`.
- Legacy duplicate routes alongside canonical ones: root `health/`, `app/builder/*`, `app/dashboard/ai-generator`, `TriEngineShell.tsx`.

---

## 6. Orphaned / archived trees (delete or archive)

- `my-agent/` — mock ADK experiment, not wired, 402 MB node_modules
- `coder/` — stale duplicate of `packages/ide-engine`
- `spatial-platform/` — abandoned parallel monorepo
- `npc-sim/`, `custom-engine/` — NPC concepts superseded by `apps/web` + `engine`
- `wp-content/`, `content/` — WordPress scratch and docs copy
- `public/litefilesystem.js-master/` — vendored third-party
- `agent/` (Python) — reconcile: deploy it or drop the `alice-proxy` → `http://localhost:8000` dependency

---

## 7. What's genuinely good

- Model API routes: `api/terminal/exec` (allowlist + path boundaries + ownership), `api/agent` (command whitelist), `(published)/…/route.ts` file server (sanitization, MIME map, CSP, `nosniff`, immutable cache).
- `lib/ssrf-safe-fetch.node.ts` — real DNS+IP verification.
- RLS on nearly every table; AES-256-GCM encryption for `ai_provider_configs`/`cloud_connections`/`extensions`; multi-stage Dockerfiles; placeholder-marker gate (`scripts/no-placeholders.sh`).
- Provider-chain/fallback AI design in `engine/core/ai`.

---

## 8. Prioritized recommendations

1. **Disable/rotate legacy Supabase service-role + anon keys in the dashboard now** (still live), rotate/revoke the OpenRouter key, then scrub `.env`/keys from git history (`git filter-repo`). Fix the mislabeled `STRIPE_SECRET_KEY`→publishable in `.env`.
2. **Enforce auth + tenant isolation** on the ~15 unauthenticated/cross-tenant routes; remove or gate smoke-auth.
3. **Fix named bugs:** `smakeUserId`, `DEFAULT_MODE`, `writeFileSync(dir)`, broken barrel export, `perdict-risk.mjs`, runModel conflict, missing k8s files (`deploy/k8s/namespace.yaml`, `coder-config.yaml`).
4. **Delete/archive orphaned trees** listed in §6.
5. **Harden images/k8s:** non-root runtime, slim `node_modules`, code-server auth, close ufw 5000, replace `CHANGE_ME` token.
6. **Reconcile Supabase migrations** against a clean DB; consolidate Supabase/Prisma/DB clients.