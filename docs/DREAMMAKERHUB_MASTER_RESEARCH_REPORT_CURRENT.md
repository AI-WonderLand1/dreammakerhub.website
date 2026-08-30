# DreamMakerHub Master Technical & Commercial Research Report — Current Snapshot

_Last verified: 2026-08-30_

> Historical evidence remains in `DREAMMAKERHUB_MASTER_RESEARCH_REPORT.md` and dated `docs/research/` addenda. This file is the current consolidated snapshot; newer source evidence supersedes older conclusions.

## Current verdict

DreamMakerHub is a substantial early-stage platform, not a simple mockup. Source evidence supports real AI model routing, authenticated premium chat, usage/realtime infrastructure, multi-stage AI building, Coder/Kubernetes workspace integration, browser-local WebContainer tooling, engine adapters, Spatial/Gaussian-splat integration, an Expo/EAS mobile shell, and separate native C++/Vulkan engine work.

It is **not production-safe as one unified commercial product yet**. The highest-risk gaps are canonical billing/entitlement, build-cost controls, deployment-safe persistence, incomplete pipeline-to-engine execution, Coder identity mapping, mobile verification, licensing/IP boundaries, NPC live-runtime wiring, sponsor payment collection, and cross-repository AI authorization.

## Repository map

### `AI-WonderLand1/dreammakerhub.website`

Latest observed application head: `71aac058` (`redirect lloop nginx`, 2026-08-29), following `71d3d249` (`dns upcloud`). No newer application commit was observed in the current run; the latest research commit is separate documentation.

Verified/substantially real:
- OpenRouter/provider routing and model fallback.
- Authenticated premium chat and usage/realtime infrastructure.
- Multi-stage `/api/build/stream` AI generation.
- Direct `pipeline-v1` AI runtime.
- Coder/Kubernetes workspace API integration.
- Browser-local WebContainer IDE architecture.
- Engine adapter and Spatial/Gaussian-splat paths.
- Expo/EAS mobile shell.
- Stripe Checkout Session creation and webhook signature verification.
- Founding sponsorship documentation.
- Filesystem-writing Builder bridge: generated code is security-checked and written with `writeFileSync`.

Current gaps:
- `/api/build/stream` is an older route, accepts anonymous requests, makes multiple model calls, and does not visibly enforce a comparable paid quota/usage boundary.
- Build persistence exists, but the route does not reliably inspect the bridge status before reporting success, and container filesystem writes are not automatically durable in every deployment model.
- The older `engine/core/pipelines.ts` bridge still has missing/undefined compiler references, placeholder AI/expression functions and Base64 mislabeled as encryption; the newer pipeline-v1 direct AI runtime is real.
- Graph dependency-output mapping remains incomplete and its `getAllNodes()` call conflicts with the inspected `ExecutionGraph` interface.
- `getAuthUser()` only treats Auth `app_metadata.plan === 'pro'` as paid and swallows server-side session-fetch failures.
- Stripe/webhook/database/Auth entitlement synchronization is not proven as one canonical chain; public checkout still uses a hard-coded Payment Link instead of the dynamic checkout endpoint.
- `user_profiles` RLS permits owner updates to subscription/limit fields that should be server-controlled.
- Sponsorship offer exists but still lacks a dedicated tier-aware collection flow.
- README proprietary/confidential terms still conflict with the root MIT license.
- Coder workspace creation still appears to poll using a locally generated UUID rather than the returned Coder workspace ID.

### UpCloud deployment

DreamMakerHub is moving toward UpCloud VM + Docker Compose. nginx proxies application hosts to `web:5000` and Coder/IDE hosts to `coder:7080`, with WebSocket upgrade headers. The Compose stack defines Coder, Coder PostgreSQL, web, optimizer, nginx and Certbot; it does **not** define AI-PLAYGROUND or NPC-AI-SIM services.

P0 risks:
- `.github/workflows/deploy-upcloud.yml` still runs `cp deploy/upcloud/.env.example .env` before Compose startup. The checked-in example contains placeholders. If the VM `.env` is the live configuration, automated deploys can overwrite production configuration.
- TLS workflow requests root/www/coder/ide/wildcard-coder/ai certificates while nginx also names `play`, `playground`, `wonderplay-3d`, and `civo-test`. Coverage for all names is not proven.
- Cloudflare DNS migration is not externally verified from repository evidence; README status conflicts with the newer migration commits.

### `AI-WonderLand1/AI-PLAYGROUND`

Current repository is directly accessible. Latest observed commit activity includes the 2026-08-28 UpCloud deploy workflow.

Verified:
- Vite/React frontend plus Express server.
- Real provider routing/streaming for OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together, Fireworks, DeepSeek, Perplexity, xAI and Gemini.
- Wonderland-key validation and independent chat/stream/template rate limits.
- Stripe webhook handling and security policy.
- Workflow/template/library work.

Important current contract finding:
- `server/wonderland-keys.ts` builds a static Set from `WONDERLAND_KEYS` environment values. There is no visible issuance, rotation, database mapping, user entitlement lookup or Stripe lookup.
- `/api/chat` and `/api/chat/stream` require that key in the request body before calling the provider registry.
- Therefore DreamMakerHub user entitlement -> AI-PLAYGROUND authorization remains unproven and is a real cross-repository commercial blocker.

Deployment gap:
- `package.json` requires a Vite build and a running Express server (`build`, `server`, `start`).
- `.github/workflows/deploy.yml` only rsyncs the repository to `209.50.53.112:/var/www/html/`; it does not install dependencies, build, start or restart a server. The actual target-host process manager remains unresolved.
- Replicate and Hugging Face remain explicit provider stubs.

### `AI-WonderLand1/NPC-AI-SIM`

This is the current repository identity for the former WonderPlay 3D project. The rename sequence completed 2026-08-28 and DreamMakerHub references were updated accordingly.

Verified:
- TypeScript/React application and Express server.
- Real Gemini-backed NPC tactical reasoning, vision and video analysis endpoints.
- PlayCanvas/Three.js and GLTF tooling.
- NPC dialogue/voice/animation/safety modules.
- WebSocket server object and `/live-npc` handler logic.

Current gaps:
- `server.ts` dynamically imports `ws` and constructs `WebSocketServer({ noServer: true })`, but the inspected source does not prove an HTTP upgrade handler calls `wss.handleUpgrade`.
- Previous manifest audit found `@types/ws` without a matching `ws` runtime dependency; this remains a manifest/lockfile verification item.
- Live viseme behavior is randomized/simulated in the WebSocket handler; provider-backed Gemini intelligence exists separately.
- DreamMakerHub's `/api/npc/live` bridges to `https://npc-ai-sim.dreammakerhub.website/live-npc?id=...`, but end-to-end deployment/upgrade/brain connectivity is not proven.
- Visible NPC ownership verification in the live bridge remains incomplete.
- Subscription routes are in-memory, email-keyed, caller-tiered demo scaffolding rather than canonical billing.
- GitHub metadata reports no declared repository license.

## Native engine projects

`MOBILEAPP-VANGUARD-ENGINE` and `vanguard-engine` contain real C++/Vulkan engine/editor architecture, Android window/input integration and CI build configuration. The source is not yet sufficient to call the Android renderer production-ready: previous inspection found raw GLSL passed where Vulkan shader modules require SPIR-V and an apparent swapchain extent issue. Their relationship/lineage is not yet conclusively established.

## Genuine implementation vs scaffolding

### Substantially real
- Provider transport/routing and premium chat.
- Usage/realtime infrastructure.
- Multi-stage AI builder.
- Direct pipeline-v1 AI runtime.
- Coder/Kubernetes and WebContainer IDE architecture.
- Engine adapters and Spatial/Gaussian-splat rendering path.
- Stripe checkout-session creation and webhook signature verification.
- AI-PLAYGROUND provider/rate-limit/key-validation server.
- NPC-AI-SIM Gemini reasoning/vision/video endpoints and 3D/NPC modules.
- Expo/EAS mobile shell.
- Filesystem-writing Builder bridge.
- UpCloud/nginx/Docker deployment configuration.

### Scaffolding/incomplete/unsafe for commercial scale
- Build endpoint authentication/quota/usage enforcement.
- Deployment-safe Builder artifact persistence.
- Pipeline-to-engine graph compiler/dependency mapping.
- Canonical Stripe entitlement synchronization.
- Client-controlled subscription/quota fields.
- Dedicated sponsor payment collection.
- Proprietary-vs-MIT licensing boundary.
- Mobile dependency/EAS identity alignment and verified build.
- Coder workspace ID mapping.
- NPC live WebSocket upgrade/runtime and non-simulated viseme/audio loop.
- Cross-repository Wonderland-key contract.
- AI-PLAYGROUND production deployment/restart path.
- UpCloud DNS/TLS migration verification.

## Licensing/IP

DreamMakerHub's README presents proprietary/confidential commercial terms while the root `LICENSE` grants MIT rights to use, modify, distribute, sublicense and sell the Software. Scope must be corrected before commercial claims. NPC-AI-SIM currently has no declared GitHub license. Third-party dependency licensing must be inventoried separately.

## Commercial readiness

### Sponsorship
The Founding Sponsor offer exists with monthly/quarterly/annual tiers, but no dedicated tier-aware sponsor payment flow is proven. Sponsorship should be framed as sponsorship/partnership rather than investment or guaranteed return.

### Subscriptions
Stripe components exist, but public checkout, webhook persistence, database schemas and Auth metadata are not proven to form one canonical entitlement chain.

### AI cost control
AI-PLAYGROUND has rate limiting and Wonderland-key validation. DreamMakerHub `/api/build/stream` still lacks a comparable visible authentication/quota boundary and can trigger multiple model calls per build.

## P0 blockers before public commercial scale

1. Stop deployment from overwriting live `.env` with `.env.example` unless that is explicitly the intended secret-management model.
2. Verify live Cloudflare DNS and TLS SAN coverage for every nginx hostname.
3. Prove the actual AI-PLAYGROUND production process after rsync.
4. Establish one canonical commercial entitlement source and map it securely to AI-PLAYGROUND authorization.
5. Make subscription/usage/limit fields server-controlled.
6. Require authenticated build access or enforce hard anonymous limits and metering.
7. Make AI/compute quota consumption atomic.
8. Keep service-role operations server-side.
9. Replace hard-coded public Stripe Payment Link with plan/interval-aware checkout.
10. Make Builder persistence deployment-safe and report success only after confirmed writes.
11. Resolve README-vs-MIT licensing contradiction.
12. Add a real sponsor payment/collection path.

## P1 blockers

1. Complete pipeline-to-engine graph compilation and dependency-output mapping.
2. Fix Coder workspace ID polling and verify Supabase -> Coder identity mapping.
3. Decide/document WebContainer vs Coder workspace boundaries.
4. Align mobile dependencies/EAS project IDs, update lockfiles and prove an APK build.
5. Connect mobile to a real authenticated build contract.
6. Add/verify `ws` runtime and HTTP upgrade handling in NPC-AI-SIM.
7. Verify NPC ownership before live bridging.
8. Replace simulated NPC visemes/audio with a provider-backed runtime.
9. Complete SBOM/license/IP mapping.
10. Remove stale WonderPlay 3D deployment references after rename.
11. Reconcile stale deployment documentation with actual infrastructure.

## 2026-08-30 unresolved dependency queue

**Next target 1:** determine the actual process manager/service for AI-PLAYGROUND on `209.50.53.112` from repository-side deployment/configuration evidence.

**Next target 2:** trace DreamMakerHub subscription state into any generation/storage of `WONDERLAND_KEYS`; if none exists, document the exact service-to-service authorization gap and candidate secure design.

**Next target 3:** trace NPC-AI-SIM's HTTP server startup and WebSocket upgrade path, then reconcile its runtime dependency/lockfile with the `ws` import.

**Next target 4:** verify the current Coder workspace identity path and returned Coder ID handling.

See `docs/research/2026-08-30-latest-findings.md` for today's evidence.
