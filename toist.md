# DreamMakerHub — Deep Review To-Do List

---

## 🔴 Critical (Fix Immediately)

### Security — Authentication
- [ ] **AUTH BYPASS:** `api/ai/auth.ts:8-11` — `requirePaidAIUser()` trusts spoofable `x-replit-user-id` header with zero server verification. Any user can impersonate any user. Add Supabase `getUser()` validation.
- [ ] **NO AUTH ON 12+ ROUTES:** `api/ai/route.ts`, `api/ai/image/route.ts`, `api/save/route.ts`, `api/errors/route.ts`, `api/openrouter/chat/route.ts`, `api/wonderspace/terminal/route.ts`, `api/wonder-sync/push/route.ts`, `api/wonder-sync/pull/route.ts`, `api/wonder-sync/commit/route.ts`, `api/wonder-sync/fork-remote/route.ts`, `api/workspace/provision/route.ts`, `api/3d-cli/create/route.ts` — All completely unauthenticated. Add Supabase session checks to each.
- [ ] **STRIPE WEBHOOK BYPASS:** `api/webhooks/stripe/route.ts:21-30` — When `STRIPE_WEBHOOK_SECRET` is unset, any POST body is accepted as valid. Reject requests when secret is missing instead of parsing blindly.
- [ ] **PLAINTEXT API KEY STORAGE:** `api/keys/api/route.ts:60-66` — API keys stored as raw plaintext in `api_keys` table. `api/keys/route.ts` correctly hashes. Fix `keys/api` to hash keys.
- [ ] **SMOKE MODE AUTH BYPASS:** `lib/smokeAuth.ts:4-5` — `validateToken()` accepts any non-empty string. If smoke mode enabled in production, all requests auto-authenticate. Add env guard to prevent production use.

### Security — Secrets Exposure
- [ ] **SECRETS IN CLIENT BUNDLE:** `lib/env.ts:14-27` — `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `EXTENSION_ENCRYPTION_KEY`, and 10+ API keys exported in the default `env` object despite file's own warning not to. Any `'use client'` component importing `env` leaks all secrets to browser DevTools. Move all server secrets to `serverEnv` only.
- [ ] **HARDCODED LITELLM KEY:** `config/litellm/config.yaml:2` — `master_key: sk-1234` is trivially guessable. Replace with env var and rotate immediately.
- [ ] **TERRAFORM STATE + TOKENS COMMITTED:** `infra/coder/template/terraform.tfstate` — Contains plaintext agent token `da8e72d2-22ce-47df-99aa-056da3be9bd2`. Add `*.tfstate*` to `.gitignore`, remove from git history, rotate token.

### Security — Code Execution
- [ ] **VM2 SANDBOX ESCAPE:** `engine/core/ai/manifest-builder.ts:11`, `engine/core/runners/vm2Runner.ts:27,67` — AI-generated code executed in VM2 which has known CVEs (CVE-2023-37466, CVE-2023-37903). Replace with Node.js `vm` or `isolated-vm`. Restrict sandbox `fetch` to URL whitelist.
- [ ] **COMMAND INJECTION RISK:** `engine/core/aetherguard/repairs/eslintFix.ts:6,28`, `depsUpdate.ts:6,28` — `execSync` runs shell commands. Replace with `execa` (async, no shell). Ensure `workspaceRoot` is never user-influenced.
- [ ] **UNSANITIZED AI CODE WRITTEN TO DISK:** `engine/core/ai/bridge.ts:11-20`, `manifest-builder.ts:14-18` — AI-generated code written to filesystem and executed without calling `SecurityCore.validateCodeSafety()`. Add sanitization before write and execute.

### Security — Injection / XSS
- [ ] **XSS IN PROJECT PREVIEW:** `app/(preview)/preview/[projectId]/page.tsx:72` — `dangerouslySetInnerHTML` renders user HTML from storage with zero sanitization. Use DOMPurify or CSP.
- [ ] **XSS IN TEXTBLOCKS:** `lib/puck-lite/components/TextBlock.tsx:4`, `app/(builder)/wonder-build/puck/components/TextBlock.tsx:4` — `dangerouslySetInnerHTML` renders AI-generated HTML unsanitized. Sanitize before render.
- [ ] **PROMPT INJECTION:** `engine/core/ai/promptBuilder.ts:7-18` — User input interpolated into prompts with no escaping. Use `<user_input>` delimiters and instruct model to treat as data.

### Security — Path Traversal / SSRF
- [ ] **PATH TRAVERSAL IN FILES:** `packages/wonder-runtime/src/server.js:263-282` — `/files/*` endpoint reads files without `isPathSafe()` check. Add the same check used by `/editor/*` and `/playcanvas/*`.
- [ ] **PATH TRAVERSAL IN SCENES:** `api/scenes/assets/[filename]/route.ts:11` — `filename` from URL passed to Supabase `download()` unsanitized. Validate against traversal patterns.
- [ ] **SSRF VIA PROXY:** `api/tenant-ide-proxy/[...path]/route.ts:48-52` — Forwards all client headers to upstream. Validate path and restrict forwarded headers.
- [ ] **SSRF VIA RUNTIME PROXY:** `api/projects/[projectId]/runtime/proxy/[...path]/route.ts:70-71` — Catch-all path forwarded to runtime service unsanitized. Validate path.
- [ ] **SSRF VIA GIT REMOTE:** `api/wonder-sync/fork-remote/route.ts:1-34` — No auth. Attacker can set git remote to malicious URL. Add auth + validate remote URL.
- [ ] **CODE-SERVER NO AUTH:** `infra/coder/template/main.tf:119`, `templates/python-ide/main.tf:38`, `templates/playcanvas-3d/main.tf:160`, `templates/node-ide/main.tf:34` — All launch code-server with `--auth none`. Use password or Coder proxy auth.

---

## 🟠 High (Fix Before Next Release)

### Security — Additional
- [ ] **TIMING SIDE-CHANNEL:** `api/webhooks/incoming/[projectId]/route.ts:59` — HMAC comparison uses `!==` instead of `crypto.timingSafeEqual()`. Fix comparison.
- [ ] **SUPABASE ANON KEY SERVER-SIDE:** `engine/core/ai/personas.ts:34-35` — Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` for server-side DB access. Use service role key instead.
- [ ] **HARDCODED N8N WEBHOOK:** `engine/core/ai/providers/n8n.ts:9` — Falls back to hardcoded production URL. Throw error if env var missing.
- [ ] **API KEY LEAKAGE IN ERRORS:** `engine/core/ai/providers/openai.ts:70`, `openrouter.ts:71` — AI API error messages may contain keys. Sanitize before including in responses.
- [ ] **WEAK SANITIZER:** `engine/core/security/Sanitizer.ts:8-18` — String-only blocklist trivially bypassed via encoding, quotes, template literals. Use AST analysis or regex patterns. Add `child_process`, `require('fs')`, `spawn`, `new Function`.
- [ ] **PUBLIC STORAGE BUCKET:** `scripts/upload-scenes-to-supabase.js:39` — Creates public bucket. Use `public: false` + signed URLs.
- [ ] **PUBLIC SCENE URLS:** `infra/services/storage/promoteTempScene.ts:90` — Constructs public URLs bypassing RLS. Use signed URLs with expiration.
- [ ] **UNAUTHENTICATED GITHUB API:** `infra/services/marketplace/MarketplaceAgent.ts:74` — `new Octokit()` without token. 60 req/hr limit. Add token from env.
- [ ] **SUPABASE PLACEHOLDER FALLBACK:** `infra/lib/supabase/server-client.ts:7-8` — Falls back to `placeholder.supabase.co`. Throw error instead.

### Infrastructure
- [ ] **NODEPORT EXPOSURE:** `infra/coder/ingress-nginx-nodeport.yaml:21-26` — Hardcoded NodePorts 30080/30443 bypass LB security groups. Use LoadBalancer type.
- [ ] **SSH IN WORKSPACE CONTAINERS:** `infra/coder/template/main.tf:115-116`, `playcanvas-3d/main.tf:113-114` — SSH daemon started. Remove unless needed; if needed, key-only auth.
- [ ] **NO SECURITY CONTEXT:** `infra/wonder-runtime/deployment.yaml:18-46` — Missing `runAsNonRoot`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation: false`. Add security context.
- [ ] **NO NETWORK POLICIES:** All infra YAML files — No `NetworkPolicy` resources. Pods can communicate freely. Add least-privilege network policies.
- [ ] **EAGER ENV VALIDATION:** `infra/lib/env.ts:10-13` — `requireEnv()` at module top-level crashes import chains. Export lazy accessors instead.

### Auth & CORS
- [ ] **BROKEN CORS:** `middleware.ts:37-39` — Joins all origins into single header string, overwriting per-origin header. Fix to only set matching origin.
- [ ] **SUPABASE CLIENT CACHING:** `lib/supabase/client.ts:10-37` — Singleton client may cause stale sessions after token rotation. Re-create on auth state change.

### AI Safety
- [ ] **UNVALIDATED AI RESPONSES:** `engine/core/ai/pipeline-v1/runtime/pipeline.ts:96-115` — AI-generated code executed without validation. Add `SecurityCore.validateCodeSafety()` gate.
- [ ] **CONSTITUTIONAL BYPASS:** `engine/core/ai/constitutional-prompt.ts` — Rules can be bypassed via prompt injection in user input. Add input sanitization layer.

### Frontend
- [ ] **UNSAFE innerHTML:** `components/playcanvas-isolation/client/IsolatedPlayCanvas.tsx:178,213` — `innerHTML` usage. Replace with `textContent` or React refs.

---

## 🟡 Medium (Plan for Sprint)

### Code Quality
- [ ] **DUPLICATE STORAGE LAYERS:** `apps/web/services/storage/` vs `infra/services/storage/` — Consolidate into single implementation.
- [ ] **DEAD CODE IN ENGINE:** `engine/core/` — Multiple unused files and exports. Run `ts-prune` and clean up.
- [ ] **INCONSISTENT ERROR HANDLING:** API routes use mixed patterns (some throw, some return NextResponse, some silently fail). Standardize.
- [ ] **CONSOLE.LOG LEFT IN:** Multiple files still have `console.log` statements. Replace with logger or remove.

### Testing
- [ ] **ZERO TEST COVERAGE:** `tests/health.test.ts` is the only test (trivial assertion). Add unit tests for:
  - `engine/core/security/Sanitizer.ts`
  - `engine/core/ai/runModel.ts` provider routing
  - `engine/core/ai/promptBuilder.ts`
  - `apps/web/lib/auth.ts`
  - `apps/web/lib/env.ts`
  - API route auth checks

### Frontend
- [ ] **NAVBAR FLICKER:** Auth state changes cause UI flicker. Add loading state.
- [ ] **REDIRECT LOOP:** Login/logout redirects don't persist intended destination. Store in localStorage.
- [ ] **SIGNPOST HREFS:** Verify all `href` values in `InteractiveSignpost.tsx` match existing route files.
- [ ] **LAZY LOADING:** Heavy components (PlayCanvas, WebGL, Monaco) loaded eagerly. Add `React.lazy()` + Suspense.
- [ ] **MISSING ERROR BOUNDARIES:** Not all route segments have error boundaries. Add per-segment error.tsx.

### Bundle & Performance
- [ ] **DEPENDENCY AUDIT:** Run `npm ls` and remove unused packages.
- [ ] **IMAGE OPTIMIZATION:** Unoptimized images increase bundle size. Use Next.js `Image` component.
- [ ] **WEBPACK CHUNKS:** Review chunk splitting in `next.config.mjs` — some chunks may be too large.

---

## 🟢 Low (Backlog)

### Accessibility
- [ ] Add `aria-labels` to all interactive elements
- [ ] Test keyboard navigation for all dropdowns/modals
- [ ] Verify screen reader compatibility with `SpiritGuide.tsx`

### Documentation
- [ ] Document all API routes in `openapi.yaml`
- [ ] Add JSDoc to `engine/core/` public functions
- [ ] Document deployment process in `docs/`

### Cleanup
- [ ] Remove stale TODO files (`3Dtodo.md`, `NPC_CIVILIZATION_SIM_TODO.md`, `pixel_forge_todo.md`)
- [ ] Remove `.opencode/node_modules/` from repo
- [ ] Clean up `node_modules/` in committed directories
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Run `npm outdated` and plan upgrades

### DevOps
- [ ] Add health check endpoints to all services
- [ ] Add Prometheus metrics to API routes
- [ ] Set up CI/CD lint + typecheck + test gates
- [ ] Add Docker image scanning to pipeline
