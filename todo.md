# DEEP CODE REVIEW — dreammakerhub.website (AI Wonderland)

**Date:** 2026-07-15
**Scope:** Full codebase — 15+ directories, 500+ source files, 6 analysis layers
**Overall Finding:** **26 CRITICAL**, **53 HIGH**, **93 MEDIUM**, **82 LOW** issues across 254 total findings

---

## LAYER 1: CRITICAL SEVERITY — Immediate Security Incidents

| # | Location | Issue |
|---|----------|-------|
| 1 | `my-key.pem`, `aws-aiwpnderland.pem`, `new-aws-key` | **SSH/AWS private keys committed to git history.** `.gitignore` added after tracking — keys still extractable via `git log`. Full VPS/AWS compromise risk. |
| 2 | `infra/coder/template/terraform.tfstate` + `.backup` | **Live Coder agent tokens in plaintext** (`token: da8e72d2-22ce-47df-99aa-056da3be9bd2`). Anyone with repo access can authenticate to workspace agents. |
| 3 | `supabase/migrations/20260615_ai_provider_configs.sql:22-44` | **RLS bypass: `ai_provider_configs`** — all 4 policies use `auth.uid() IS NOT NULL` instead of `auth.uid() = user_id`. Any authenticated user can read/modify/delete other users' encrypted API keys. |
| 4 | `supabase/migrations/005_create_project_domains_table.sql:50-70` | **Domain hijacking** — `verify_project_domain()` is SECURITY DEFINER but never checks the `verification_token`. Any user who knows a domain UUID can "verify" it. |
| 5 | `apps/web/app/api/environments/ssh-key/route.ts` | **Unauthenticated SSH key endpoint** — GET/POST/DELETE on SSH keys with zero auth checks. Any anonymous user can read, create, or delete SSH keys. |
| 6 | `.github/workflows/auto-remediate.yml` + `ai-remediate.mjs` | **AI auto-commit pipeline** — CodeQL findings trigger AI-generated code that is automatically committed and pushed with `git add .` + `git push`. No human review gate. AI controls file paths for writes. |
| 7 | `apps/web/lib/supabase-service.ts` | **Exports `null as any`** — workspace provisioning and auth form import this null client, causing all Supabase operations to fail at runtime. |

---

## LAYER 2: HIGH SEVERITY — Critical Vulnerabilities

### Authentication & Authorization
| # | Location | Issue |
|---|----------|-------|
| 8 | `apps/web/middleware.ts:37-39` | CORS headers sent to ALL origins even when origin is NOT in allowed list |
| 9 | `apps/web/app/api/collaboration/route.ts:27-41` | POST accepts arbitrary `userId` from request body without auth verification |
| 10 | `apps/web/app/api/ai/chat/route.ts:102,128` | `memoryContext` and `plan` variables used before declaration — TDZ ReferenceError crashes every request |
| 11 | `apps/web/components/playcanvas-isolation/utils/auth.ts:4-26` | Mock user session returns `'demo-user-' + Date.now()` — not production auth |
| 12 | `apps/web/app/api/projects/[projectId]/publish/route.ts:21-66` | User values inserted directly into HTML without escaping — stored XSS in published projects |
| 13 | `apps/web/app/(preview)/preview/[projectId]/page.tsx:10-20` | Regex-based HTML sanitization is bypassable (nested tags, HTML entities, event handlers) |

### Infrastructure
| # | Location | Issue |
|---|----------|-------|
| 14 | `infra/coder/templates/*/main.tf` (all 4 templates) | `code-server --auth none` — unauthenticated access to IDE terminal |
| 15 | `infra/lib/supabase/server-client.ts:7-8` | Falls back to `placeholder.supabase.co` with `placeholder-key` if env vars missing — silent data leak |
| 16 | `infra/services/marketplace/MarketplaceAgent.ts:74` | Unauthenticated Octokit — 60 req/hour rate limit, no private repo access |
| 17 | `infra/services/stripe/payments.ts` | Stripe secret key defaults to empty string — operations silently fail |
| 18 | `supabase/migrations/20260318162150_new-migration.sql:30-40` | Extensions table: `USING (true)` SELECT allows unauthenticated read of all extensions |
| 19 | `supabase/migrations/009_create_profiles_and_projects.sql:179` | `client_error_logs` INSERT `WITH CHECK (true)` — any user (including anon) can flood table |
| 20 | `supabase/migrations/001_create_workspaces.sql:24` | `workspaces` INSERT `WITH CHECK (true)` — arbitrary owner_id injection |

### CI/CD Supply Chain
| # | Location | Issue |
|---|----------|-------|
| 21 | `.github/workflows/ci.yml:28-29` | `CEREBRAS_API_KEY` and `Wonder_Build_2026` in build env — may leak to logs or bundled output |
| 22 | `.github/workflows/sync-assets.yml:29` | `DATABASE_URL` (direct connection) exposed in CI env |
| 23 | `.github/workflows/optimizer.yml` | Docker image pushed as `:latest` only — no version pinning, no rollback capability |
| 24 | `apps/web/Dockerfile:58` | Entire `node_modules` (100+MB) copied to production image |
| 25 | `apps/web/next.config.mjs:109-111` | `typescript: { ignoreBuildErrors: true }` — type errors ship silently to production |

### Engine & Packages
| # | Location | Issue |
|---|----------|-------|
| 26 | `engine/core/runners/vm2Runner.ts` | VM2 dependency is **deprecated and has known sandbox escape CVEs** — not safe for code execution |
| 27 | `engine/core/pipelines.ts` | Base64 "encryption" — `btoa()` is not encryption, easily reversible |
| 28 | `engine/core/ai/providers/webhook.ts`, `custom-api.ts` | No SSRF protection — arbitrary HTTP requests to internal networks |
| 29 | `packages/playground-sync/src/index.ts:285-287` | EventSource SSE without authentication — any userId can be eavesdropped |

---

## LAYER 3: MEDIUM SEVERITY — Significant Issues

### Security
| # | Location | Issue |
|---|----------|-------|
| 30 | `apps/web/next.config.mjs:171-185` | CSP is `Report-Only` — XSS not actually blocked |
| 31 | Multiple API routes | No CSRF protection on any state-changing endpoint |
| 32 | `apps/web/app/api/auth/session/route.ts:20` | Session `access_token` returned in API response body |
| 33 | `apps/web/app/api/projects/[projectId]/runtime/proxy/[...path]/route.ts:71` | Path traversal protection only strips `..` — not `%2e%2e`, `..%2f`, etc. |
| 34 | `apps/web/app/api/ai/route.ts:31` | `sanitizeInput` only strips `<>` — prompt injection not prevented |
| 35 | `apps/web/components/playcanvas-isolation/client/PlayCanvasClient.ts:121` | `postMessage` with `'*'` origin — messages sent to any origin |
| 36 | `supabase/migrations/20260706_playground_sync.sql:139-142` | Hardcoded sync key `dmh_playground_sync_key_change_me_in_production` committed |
| 37 | `supabase/migrations/20250108_signup_rate_limiter_migration.sql` | `signup_attempts` table has no RLS — IP addresses exposed |
| 38 | `apps/web/.env` | Committed to source control — reveals all secret names |

### Code Quality
| # | Location | Issue |
|---|----------|-------|
| 39 | `apps/web/lib/supabaseServer.ts:1-28` | `supabaseServer` is a no-op Proxy returning mock data |
| 40 | 5+ files | 5 different Supabase client initialization patterns — inconsistent auth behavior |
| 41 | `engine/core/pipeline-runner.ts` | Broken import paths, `as any` casts, error masking in catch blocks |
| 42 | `engine/core/ai/orchestrator.ts:34` | Unprofessional error: `"Runner failed. Probably because it sensed your incompetence."` |
| 43 | `engine/core/playground/session.ts` | Unbounded in-memory session Map — memory leak in serverless |
| 44 | `apps/web/app/api/convai/chat/route.ts:18` | Module-scope conversation Map — never cleaned, cross-user data risk |
| 45 | `packages/wonder-runtime/src/server.js:18` | In-memory rate limit store — not shared across instances |

### CI/CD
| # | Location | Issue |
|---|----------|-------|
| 46 | All workflows | `actions/checkout@v7` without `persist-credentials: false` |
| 47 | All workflows | Actions pinned to major version tags, not SHA — supply chain risk |
| 48 | `ci.yml`, `auto-remediate.yml` | `npm install` instead of `npm ci` in CI — non-deterministic builds |
| 49 | `auto-remediate.yml:70` | `git add .` stages ALL files, not just the intended fix |
| 50 | `.github/scripts/perdict-risk.mjs` | Filename typo — workflow expects `predict-risk.mjs`, will FAIL |

---

## LAYER 4: LOW SEVERITY — Code Quality & Hygiene

| Category | Count | Examples |
|----------|-------|---------|
| Dead code / unused files | 15 | `test-setup.ts`, `test-execution.ts`, `=3.0.7`, `supabase-service.ts`, `webglstudio.js-master/` vendored |
| Console.log in production | 10+ | `engine/core/index.ts`, `engine/core/runtime/engine-manager.ts`, most adapters |
| Magic numbers | 8 | `0.6`, `0.7` importance values, `5000` ms timeout, `10000` limit |
| `as any` type casts | 5 | `pipeline-runner.ts:29`, `engine-manager.ts`, `node.ts:1`, `tick.ts:43` |
| Inconsistent auth patterns | 6 | `getUser()`, `getSession()`, `requirePaidAIUser`, `requireAuth`, `getSmokeUserIdFromRequest` — no unified middleware |
| Missing type definitions | 5 | `ProjectMetadata`, `BuildCodeGenPromptArgs`, `Platform`, `AgentName` — broken imports |
| Hardcoded paths | 4 | `sync-cron.sh`, `test-ai-implementation.sh`, `deploy-ide.sh`, `ecosystem.config.cjs` |
| Missing `set -e`/`pipefail` | 4 | `sync-cron.sh`, `build-linux.sh`, `check-wonderplay.sh` |
| Deprecated configs | 2 | `ignoreDeprecations: "6.0"` in tsconfig, `.eslintrc.json` duplicate with `eslint.config.js` |

---

## LAYER 5: ARCHITECTURAL & SYSTEMIC ISSUES

### 1. Test Coverage: 0%
- **1 test file** (`tests/health.test.ts`) with **1 test** (`1+1===2`)
- Zero tests for: 100+ API routes, all engine code, all packages, all scripts, all infrastructure
- `vitest.config.ts` configured but unused for real testing

### 2. Authentication Fragmentation
- At least 7 different auth check patterns across API routes
- Some routes have NO auth (SSH keys, collaboration, error logging)
- `supabaseServer` is literally a mock proxy returning fake data
- `supabase-service.ts` exports `null as any`

### 3. Security Architecture Gaps
- No unified auth middleware — each route implements its own (or none)
- CSP is report-only, not enforced
- No CSRF protection anywhere
- RLS policies on critical tables use `IS NOT NULL` instead of owner checks
- SECURITY DEFINER functions without input validation

### 4. Deployment Risk
- Terraform state with secrets committed to git
- SSH/AWS keys in git history
- Docker images with entire `node_modules`
- No immutable image tags (`:latest` only)
- `code-server --auth none` in all workspace templates

### 5. AI Pipeline Risks
- VM2 (deprecated, CVE-prone) for code execution
- Base64 "encryption" for sensitive data
- No SSRF protection on webhook/custom-api AI providers
- AI auto-commit pipeline without human review
- Prompt injection possible (only strips `<>`)

---

## TOP 10 IMMEDIATE ACTIONS

| Priority | Action | Files |
|----------|--------|-------|
| **P0** | Rotate ALL exposed keys: SSH, AWS, Coder agent tokens, Supabase sync key | `my-key.pem`, `new-aws-key`, `terraform.tfstate*`, `playground_sync.sql` |
| **P0** | Fix `ai_provider_configs` RLS: change `IS NOT NULL` to `= user_id` | `20260615_ai_provider_configs.sql` |
| **P0** | Add auth to SSH key endpoint | `apps/web/app/api/environments/ssh-key/route.ts` |
| **P0** | Disable AI auto-commit or add human approval gate | `.github/workflows/auto-remediate.yml` |
| **P1** | Fix broken AI chat endpoint (undefined variables) | `apps/web/app/api/ai/chat/route.ts` |
| **P1** | Replace VM2 with `isolated-vm` or Node.js `vm` | `engine/core/runners/vm2Runner.ts` |
| **P1** | Enable CSP enforcement (remove `Report-Only`) | `apps/web/next.config.mjs` |
| **P1** | Fix CORS to reject non-allowed origins | `apps/web/middleware.ts` |
| **P1** | Remove `.env` and `terraform.tfstate` from git, add to `.gitignore` | Root + `infra/` |
| **P2** | Add `permissions:` blocks to all GitHub Actions workflows | `.github/workflows/*.yml` |

---

## DETAILED FINDINGS BY SUBSYSTEM

### apps/web/ (49 findings)

#### CRITICAL (5)
- **C-01**: `app/api/environments/ssh-key/route.ts` — No auth on SSH key CRUD
- **C-02**: `app/api/projects/[projectId]/auto-api/route.ts` — API keys stored in plaintext (not hashed)
- **C-03**: `app/api/projects/[projectId]/publish/route.ts` — API keys stored in plaintext (not hashed)
- **C-04**: `app/api/collaboration/route.ts` — No auth verification, accepts arbitrary userId
- **C-05**: `lib/supabase-service.ts` — Exports `null as any`, breaks workspace provisioning + auth form

#### HIGH (14)
- **H-01**: `next.config.mjs:109-111` — `ignoreBuildErrors: true`
- **H-02**: `next.config.mjs:171-185` — CSP Report-Only with `unsafe-eval` + `unsafe-inline`
- **H-03**: `middleware.ts:37-39` — CORS headers sent to non-matching origins
- **H-04**: `app/api/errors/route.ts:29-36` — Service role key in client-facing error logger
- **H-05**: `lib/ai/mem0Client.ts:35` — `supabaseRouteClient()` called without `await`
- **H-06**: `app/api/ai/chat/route.ts:102` — `memoryContext` used before declaration (TDZ)
- **H-07**: `app/api/ai/chat/route.ts:128` — `plan` variable undefined in scope
- **H-08**: `app/api/ai/chat/route.ts:102` — `memoryContext` used in enhanced prompt before declaration
- **H-09**: `app/api/spirit-guide/chat/route.ts:66` — `config` undefined when user is null
- **H-10**: `app/api/collaboration/route.ts:27-41` — Missing auth on collaboration POST
- **H-11**: `app/(preview)/preview/[projectId]/page.tsx:10-20` — Regex HTML sanitization bypassable
- **H-12**: `app/api/projects/[projectId]/publish/route.ts:21-66` — XSS in published HTML
- **H-13**: `app/api/convai/chat/route.ts:18` — In-memory conversation history, unbounded Map
- **H-14**: `app/api/workspace/provision/route.ts:2` — Imports null Supabase client

#### MEDIUM (16)
- **M-01**: `app/api/builder/export/route.ts:64` — `dangerouslySetInnerHTML` with incomplete escaping
- **M-02**: `next.config.mjs:102-107` — Wildcard image remote patterns, unoptimized images
- **M-03**: `lib/prisma.ts:8` — Non-null assertion on DATABASE_URL
- **M-04**: `lib/supabaseServer.ts:1-28` — No-op Proxy returning mock data
- **M-05**: `app/api/auth/session/route.ts:20` — access_token in response body
- **M-06**: `app/api/projects/[projectId]/runtime/proxy/[...path]/route.ts:71` — Weak path traversal protection
- **M-07**: `Dockerfile:40-44` — Dummy secrets in build args
- **M-08**: Multiple API routes — No CSRF protection
- **M-09**: `=3.0.7` stray file in project root
- **M-10**: `components/playcanvas-isolation/webcontainer/PlayCanvasContainer.ts:354` — innerHTML without sanitization
- **M-11**: `components/playcanvas-isolation/utils/ssh-keys.ts:49` — In-memory SSH key store
- **M-12**: `components/playcanvas-isolation/utils/auth.ts:4-26` — Mock user session
- **M-13**: `app/api/ai/route.ts:31` — Insufficient prompt injection protection
- **M-14**: `components/playcanvas-isolation/client/PlayCanvasClient.ts:121` — postMessage with `*` origin
- **M-15**: `build.log` committed to repository
- **M-16**: 5 different Supabase client initialization patterns

#### LOW (14)
- **L-01**: Duplicate path aliases in next.config.mjs
- **L-02**: Dead code in supabase-service.ts
- **L-03**: Console.log in production code
- **L-04**: Missing `server-only` imports
- **L-05**: `=3.0.7` stray file
- **L-06**: Deprecated `ignoreDeprecations: "6.0"` in tsconfig
- **L-07**: Inconsistent auth check patterns (7+ patterns)
- **L-08**: AuthForm.tsx imports from null client
- **L-09**: `allowJs: true` in tsconfig
- **L-10**: error-logger.ts imports browser client for server use
- **L-11**: useSubscription hook depends on potentially missing import
- **L-12**: webglstudio.js-master vendored in public/
- **L-13**: Missing enforced CSP
- **L-14**: Unused createServer and parse imports

### engine/ and packages/ (50 findings)

#### CRITICAL (7)
- **C-01**: `runners/vm2Runner.ts` — VM2 deprecated with known sandbox escapes
- **C-02**: `pipeline-runner.ts` — Broken import path `@/core/pipelines`
- **C-03**: `runtime/engine-manager.ts` — Duplicate `registerAdapter()` and `switchAdapter()` method definitions
- **C-04**: `plugins/extensionManager.ts:119` — `hookName` used before assignment
- **C-05**: `runtime/engine-manager.ts:234` — `this.supabase.from()` without null check
- **C-06**: `ai/pipeline-v1/constitutional/evaluator.ts:155` — Regex statefulness bug (global flag in loop)
- **C-07**: `ai/pipeline-v1/constitutional/evaluator.ts:155` — Regex not anchored, matches partial secrets

#### HIGH (11)
- **H-01**: `pipelines.ts` — Base64 "encryption" (btoa/atob)
- **H-02**: `ai/providers/webhook.ts` — No SSRF protection
- **H-03**: `ai/providers/custom-api.ts` — No SSRF protection
- **H-04**: `runtime/engine-manager.ts` — Service role key exposure risk
- **H-05**: `ai/pipeline-v1/confessions/engine.ts` — Factory functions missing agentName
- **H-06**: `ai/pipeline-v1/runtime/pipeline.ts:158,188,280` — Missing agentName in confession calls
- **H-07**: `runtime/canvas-tracker.ts:85` — WebGL cleanup may crash on already-lost contexts
- **H-08**: `local-memory.ts:29` — `this.db` never initialized (open() not called)
- **H-09**: `aetherguard/checks/memory.ts` — Heuristic false positives for timer leaks
- **H-10**: `aetherguard/daemon.ts:40` — setTimeout with no time argument
- **H-11**: `plugins/extensionManager.ts` — VM2 sandbox escape via require/import constructs

#### MEDIUM (15)
- **M-01-M-15**: Broken imports in narrator.ts, storage.ts, filesystem.ts; missing Platform type; missing saveFile method; dual PlaygroundModule types; sync file I/O in wonder-runtime; unbounded session maps; unquoted variables in scripts; missing return type annotations; etc.

#### LOW (17)
- **L-01-L-17**: Duplicate blocklist entries, console.log logging, unprofessional error messages, magic numbers, `as any` casts, missing type annotations, missing methods, import resolution failures, in-memory rate limiting, SSE without auth, redundant null checks, etc.

### infra/ (26 findings)

#### CRITICAL (3)
- **C-01**: `coder/template/terraform.tfstate` + `.backup` — Committed with live agent tokens
- **C-02**: `lib/supabase/server-client.ts:7-8` — Placeholder credential fallback
- **C-03**: `services/marketplace/MarketplaceAgent.ts:74` — Unauthenticated Octokit client

#### HIGH (6)
- **H-01**: `coder/templates/*/main.tf` — code-server `--auth none` (4 templates)
- **H-02**: `coder/values.yaml` — Coder auth disabled
- **H-03**: `coder/ingress.yaml` — No SSL redirect
- **H-04**: `coder/templates/python-ide/main.tf`, `node-ide/main.tf` — Command injection via `repo_url`
- **H-05**: All K8s deployments — Missing security contexts
- **H-06**: `wonder-runtime/deployment.yaml` — PlayCanvas Express on 0.0.0.0

#### MEDIUM (8)
- **M-01-M-8**: Placeholder Stripe keys, missing resource limits, no health checks, no image pull secrets, committed terraform files, missing service accounts, duplicate ingress configs, no PodDisruptionBudgets

#### LOW (9)
- **L-01-L-9**: Placeholder email in terraform, no ingressClassName, commented-out configs, missing labels, no network policies, unused variables, no PDB, missing topology constraints, no node affinity

### scripts/ and tests/ (32 findings)

#### CRITICAL (2 + 3 key files)
- **C-01**: `scripts/workspace-runtime/start-all.sh:19` — `eval $cmd &` command injection
- **C-02**: `scripts/upload-scenes-to-supabase.js:39-41` — Public Supabase bucket creation
- **C-03**: Root `my-key.pem`, `new-aws-key`, `aws-aiwpnderland.pem` — Private keys in repo

#### HIGH (5)
- **H-01**: `scripts/sync-cron.sh:5` — Hardcoded absolute path
- **H-02**: `test-ai-implementation.sh:19,29,38,47` — Hardcoded paths to `/home/wonderingtribe/`
- **H-03**: `scripts/check-wonderplay.sh` — Unquoted variable expansions
- **H-04**: Multiple scripts — Missing `set -e` / `set -o pipefail`
- **H-05**: `scripts/kubeconfig-setup.sh:54,65,75` — No input validation on paths

#### MEDIUM (10)
- Stripe key default, unsigned kubectl download, missing API timeouts, race conditions, argument handling bugs, etc.

#### LOW (12)
- Empty directories, stale scripts, placeholder code, unused test files, Python version dependency, etc.

#### Test Coverage: CRITICALLY DEFICIENT
- **1 test file** (`tests/health.test.ts`) with **1 test** (`1+1===2`)
- **Effective test coverage: 0%**
- No tests for any API routes, engine code, packages, scripts, or infrastructure

### .github/ and CI/CD (99 findings)

#### CRITICAL (4)
- **#8**: `auto-remediate.yml` — Overly broad permissions + automated code commit
- **#33**: `ai-remediate.mjs` — AI-generated file paths for arbitrary file writes
- **#34**: `ai-remediate.mjs` — AI-generated content written without validation
- **#37**: Combined AI write + auto-commit without human review

#### HIGH (11)
- Missing `permissions:` blocks in ci.yml, optimizer.yml, sync-assets.yml
- Secrets in build env vars (CEREBRAS_API_KEY, DATABASE_URL)
- Script injection via `${{ }}` in shell commands
- Docker images as `:latest` only
- Filename typo breaks predict-risk workflow
- Uncontrolled test execution in ai-remediate
- No response validation from AI
- Dummy DB URL in Dockerfile build
- Entire node_modules in production image
- Hardcoded server path in ecosystem.config.cjs
- Supply chain: AI code injection vector

#### MEDIUM (24)
- Missing `persist-credentials: false` on all checkouts
- All actions pinned to major version tags (not SHA)
- `npm install` instead of `npm ci`
- Overly broad `git add .`
- Prompt injection risk in summary workflow
- Command injection patterns in CI scripts
- Unpinned Docker base images
- GitLab CI missing secret management
- Committed .env file
- Broad CodeQL exclusions

#### LOW (17)
- Dead code, configuration quality, missing best practices, informational findings

### config/, supabase/, lib/, types/, ui/ (42 findings)

#### CRITICAL (5)
- SSH/AWS keys in git history
- RLS bypass on `ai_provider_configs`
- Exposed Replit secrets
- Extensions table RLS bypass
- SECURITY DEFINER domain verification without token check

#### HIGH (7)
- SECURITY DEFINER functions without input validation
- Unprotected INSERT policies
- Placeholder sync key
- Missing RLS on signup_attempts, components, canvas_states tables
- Coder auth disabled

#### MEDIUM (15)
- Auth disabled on Coder, undefined variables in components, broken imports, path alias conflicts, Dockerfile issues, committed .env, etc.

#### LOW (15)
- Duplicate nav items, dead code, inconsistent imports, empty catch blocks, missing type definitions, etc.

---

## SEVERITY SUMMARY

| Severity | apps/web | engine/packages | infra | scripts/tests | CI/CD | config/supabase/lib | **TOTAL** |
|----------|----------|-----------------|-------|---------------|-------|---------------------|-----------|
| CRITICAL | 5 | 7 | 3 | 5 | 4 | 5 | **29** |
| HIGH | 14 | 11 | 6 | 5 | 11 | 7 | **54** |
| MEDIUM | 16 | 15 | 8 | 10 | 24 | 15 | **88** |
| LOW | 14 | 17 | 9 | 12 | 17 | 15 | **84** |
| **TOTAL** | **49** | **50** | **26** | **32** | **56** | **42** | **255** |

---

## REMEDIATION CHECKLIST

### Immediate (P0) — Do Today
- [ ] Rotate SSH keys, AWS credentials, Coder agent tokens, Supabase sync key
- [ ] Fix `ai_provider_configs` RLS: `auth.uid() IS NOT NULL` → `auth.uid() = user_id`
- [ ] Add auth to `/api/environments/ssh-key/route.ts`
- [ ] Remove `my-key.pem`, `new-aws-key`, `aws-aiwpnderland.pem` from git history (BFG Repo Cleaner)
- [ ] Remove `terraform.tfstate*` from git, add `*.tfstate*` to `.gitignore`
- [ ] Disable or add approval gate to `auto-remediate.yml`
- [ ] Fix `verify_project_domain()` to check verification_token
- [ ] Replace `lib/supabase-service.ts` null export with real client

### High Priority (P1) — This Week
- [ ] Fix broken AI chat endpoint (undefined `memoryContext`, `plan`)
- [ ] Replace VM2 with `isolated-vm` or Node.js `vm` module
- [ ] Enable CSP enforcement (change Report-Only → Content-Security-Policy)
- [ ] Fix CORS middleware to reject non-allowed origins
- [ ] Enable `--auth` on code-server in all Terraform templates
- [ ] Hash API keys before storage in publish/auto-api routes
- [ ] Fix collaboration endpoint auth verification
- [ ] Add `permissions:` blocks to all GitHub Actions workflows
- [ ] Add RLS to signup_attempts, components, canvas_states tables
- [ ] Replace regex HTML sanitization with DOMPurify
- [ ] Fix path traversal protection in runtime proxy
- [ ] Remove `ignoreBuildErrors: true` from next.config

### Medium Priority (P2) — This Month
- [ ] Add CSRF protection to all state-changing endpoints
- [ ] Pin all GitHub Actions to SHA hashes
- [ ] Change `npm install` to `npm ci` in all CI workflows
- [ ] Add immutable Docker image tags (SHA or semver)
- [ ] Add security contexts to all K8s deployments
- [ ] Fix CORS to not send headers for disallowed origins
- [ ] Stop exposing session access_token in API responses
- [ ] Add SSRF protection to webhook/custom-api AI providers
- [ ] Remove `apps/web/.env` from source control
- [ ] Clean up 5 duplicate Supabase client patterns
- [ ] Create actual test coverage (start with API route tests)
- [ ] Add `server-only` imports to all server-side files
- [ ] Replace Base64 "encryption" with AES
- [ ] Add authentication to SSE EventSource connections
- [ ] Fix broken imports in engine (pipeline-runner, narrator, storage, filesystem)
- [ ] Add `set -euo pipefail` to all shell scripts

### Low Priority (P3) — Backlog
- [ ] Remove dead code and unused files
- [ ] Replace console.log with structured logger
- [ ] Add missing type definitions
- [ ] Fix hardcoded paths in scripts
- [ ] Remove duplicate ESLint configs
- [ ] Standardize tsconfig path aliases
- [ ] Clean up vendored webglstudio.js-master
- [ ] Add error handling to all empty catch blocks

## WonderPlay 3D — One Product + Immersive Meshy Workspace

### Part A — Unify to one "WonderPlay 3D" (nav/labels/routes)
- [x] navigation.ts: remove "3DHub Studio" + "WebGL Studio" from PAGES & PRIMARY_NAV; single WonderPlay 3D -> /dashboard/3dhub
- [x] dashboard/layout.tsx: sidebar 3D group -> one WonderPlay 3D item; PROJECT_TYPE_INFO labels
- [x] projects/[id]/page.tsx: "Open in 3DHub" -> "Open in WonderPlay 3D"
- [x] Footer.tsx: 3D column -> single WonderPlay 3D link
- [x] homepage data.ts / Homepage.tsx / InteractiveSignpost / FeatureShowcase / NpcCtaSection: one WonderPlay 3D, drop webgl links
- [x] SpiritGuideSearch.tsx: single WonderPlay 3D destination (merged aliases)
- [x] StudioApp.tsx header "3DHUB STUDIO" -> "WONDERPLAY 3D"; 3dhub/page.tsx + wonder-build/page.tsx titles
- [x] Delete app/(builder)/wonder-build/webgl/ (page + editor)
- [x] Delete app/playcanvas-isolated/ (page + layout)
- [x] 3d-cli/page.tsx labels -> WonderPlay 3D

### Part B — Immersive Meshy-style workspace (/dashboard/3dhub)
- [ ] StudioWorkspace.tsx: three-column shell (70px left rail + 320px control panel + 280px history + flex-1 center viewport)
- [ ] Left_Mode_Sidebar: Text to 3D / Image to 3D / 360 / Animate / Movie / Assets
- [ ] Generation_Control_Panel: prompt + engine chips + generate (existing /api/3d/generate-scene)
- [ ] Center_3D_Preview_Viewport: StudioViewport (PlayCanvas WebGL) + canvas toolbar
- [ ] Right_History_Sidebar: search + Asset_Preview_Grid (wrap tiles, thumbnails, click-to-load, download)
- [ ] "Open in PlayCanvas Editor" hand-off link
- [ ] Verify: lint + build + manual walk of nav surfaces
