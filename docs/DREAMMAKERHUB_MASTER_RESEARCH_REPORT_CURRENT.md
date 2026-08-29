# DreamMakerHub Master Technical & Commercial Research Report — Current Snapshot

_Last verified: 2026-08-29_

> Historical evidence remains in `DREAMMAKERHUB_MASTER_RESEARCH_REPORT.md` and the dated `docs/research/` addenda. This file is the current consolidated snapshot; older findings are corrected when newer source evidence supersedes them.

## Current verdict

DreamMakerHub is a substantial early-stage platform, not a simple mockup. Source evidence supports real AI model routing, authenticated premium chat, usage/realtime infrastructure, multi-stage AI building, Coder/Kubernetes workspace integration, browser-local WebContainer tooling, engine adapters, Spatial/Gaussian-splat integration, an Expo/EAS mobile shell, and separate native C++/Vulkan engine work.

It is **not production-safe as one unified commercial product yet**. The most urgent risks are canonical billing/entitlement, anonymous build-cost exposure, deployment-safe persistence, incomplete pipeline-to-engine execution, Coder identity mapping, mobile verification, licensing/IP boundaries, NPC live-runtime wiring, and sponsor payment collection.

## Repository map

### `AI-WonderLand1/dreammakerhub.website`

Latest observed `Master` head: `71aac05888074dcf6dce8fc0a8b01bc7d7387c64` (`redirect lloop nginx`, 2026-08-29), following `71d3d249` (`dns upcloud`).

Verified/substantially real:
- OpenRouter transport/model fallback.
- Authenticated premium chat and usage/realtime infrastructure.
- Multi-stage `/api/build/stream` AI generation.
- Direct pipeline-v1 AI runtime.
- Coder/Kubernetes workspace API integration.
- Browser-local WebContainer IDE.
- Engine adapter and Spatial/Gaussian-splat paths.
- Expo/EAS mobile shell.
- Stripe Checkout Session creation and webhook signature verification.
- Founding sponsorship documentation.
- Root production dependencies include `ws`, Stripe, Supabase, Coder/Kubernetes, WebContainer, PlayCanvas, Gaussian Splatting, Colyseus and WonderSpace tooling.

Current gaps:
- `/api/build/stream` is an older route, accepts anonymous requests, makes multiple model calls, and does not visibly enforce per-build quota/rate limits or usage deduction. Reviewer also does not receive the paid flag.
- Builder persistence is real: `engine/core/ai/bridge.ts` validates generated code and writes it with `writeFileSync`. The build route does not reliably inspect the bridge status before reporting success, and repository filesystem writes are not automatically durable across all deployment models.
- `engine/core/ai/pipeline-v1/runtime/pipeline.ts` is real direct AI execution, while the older `engine/core/pipelines.ts` bridge still contains undefined/missing compiler references, placeholder AI/expression functions and Base64 mislabeled as encryption.
- Graph executor dependency-output mapping remains incomplete and its `getAllNodes()` call conflicts with the inspected `ExecutionGraph` interface.
- `getAuthUser()` only treats Auth `app_metadata.plan === 'pro'` as paid and swallows server-side session-fetch failures.
- Stripe/webhook/database/Auth entitlement synchronization is not proven as one canonical chain; public checkout still uses a hard-coded Payment Link instead of the dynamic checkout endpoint.
- Current `user_profiles` RLS permits owner updates to subscription/limit fields that should be server-controlled.
- Sponsorship offer is published but still lacks a dedicated tier-aware collection flow.
- README proprietary/confidential terms still conflict with the root MIT license.
- Coder workspace creation still appears to poll using a locally generated UUID rather than the returned Coder workspace ID.
- Stale WonderPlay 3D names/URLs remain to be reconciled after the rename to NPC-AI-SIM.

### UpCloud deployment — new 2026-08-29 finding

DreamMakerHub is moving from Civo/AWS/Railway toward an UpCloud VM + Docker Compose architecture. nginx now proxies public application hosts to `web:5000` and Coder/IDE hosts to `coder:7080`, including WebSocket upgrade headers.

However:
- The deployment README still says most public DNS records are on Railway, conflicting with the newest `dns upcloud` commit.
- `.github/workflows/deploy-upcloud.yml` runs on `main`, pulls the repo on the VM, then executes `cp deploy/upcloud/.env.example .env` before `docker compose up -d --build`. The checked-in `.env.example` contains placeholders for Supabase, AI, Coder, Cloudflare and other credentials. This is a **P0 deployment risk** if the VM relies on `.env` for live configuration.
- The TLS workflow requests root/www/coder/ide/wildcard-coder/ai certificates, while nginx also serves `play`, `playground`, `wonderplay-3d`, and `civo-test`. Coverage for those extra names is not proven.
- DNS migration is not externally verified in this source-only audit; the repository documentation is inconsistent and must not be treated as proof of live DNS state.

### `AI-WonderLand1/AI-PLAYGROUND`

Latest observed `main` head remains `8509c6b9...` from the available commit history; latest observed commit activity includes a new UpCloud deploy workflow on 2026-08-28.

Verified:
- Vite/React frontend plus Express server.
- Real provider routing/streaming for OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together, Fireworks, DeepSeek, Perplexity, xAI and Gemini.
- Wonderland-key validation and separate chat/stream/template rate limits.
- Stripe webhook handling and security policy.
- Workflow/template/library work.

Still incomplete:
- Replicate and Hugging Face remain explicit provider stubs.
- AI-PLAYGROUND requires a `wonderlandKey`; no source evidence proves DreamMakerHub authenticated users are automatically issued/mapped to one.
- Its billing/usage contract remains separate from DreamMakerHub's Stripe/Supabase entitlement model.
- **New deployment concern:** `.github/workflows/deploy.yml` only rsyncs the repository to `root@209.50.53.112:/var/www/html/`; it does not run `npm install`, `npm run build`, or start/restart the Express server. The README describes a Node/PM2/Railway production process. Therefore GitHub Actions does not by itself prove a functioning production deployment.
- Package scripts confirm a server process is required (`server`, `start`) in addition to the Vite build.

### `AI-WonderLand1/NPC-AI-SIM`

Renamed from the formerly tracked WonderPlay 3D project on 2026-08-28. Latest observed head: `57383e4878f91a54e18b4eeed55d271669ed2eec`.

Verified:
- TypeScript/React application and Express server.
- Real Gemini-backed NPC tactical reasoning, vision and video analysis.
- PlayCanvas/Three.js and GLTF tooling.
- NPC dialogue/voice/animation/safety modules.
- WebSocket server object and `/live-npc` handler code.

Current gaps:
- `package.json` contains `@types/ws` only in devDependencies and no `ws` runtime dependency, while `server.ts` dynamically imports `ws`.
- The source creates `WebSocketServer({ noServer: true })` but does not prove an HTTP upgrade handler invokes `wss.handleUpgrade`.
- DreamMakerHub's `/api/npc/live` is an authenticated SSE bridge to `https://npc-ai-sim.dreammakerhub.website/live-npc?id=...`, but visible NPC ownership verification is missing.
- Live viseme behavior remains simulated/randomized in the inspected WebSocket code; provider-backed NPC intelligence exists separately.
- Subscription routes use an in-memory email-keyed object and caller-supplied tier; this is demo-grade, not canonical billing.
- GitHub metadata currently reports no repository license.

## Genuine implementation vs scaffolding

### Substantially real
- AI provider transport/routing and premium chat.
- Usage/realtime infrastructure.
- Multi-stage AI builder.
- Direct pipeline-v1 AI runtime.
- Coder/Kubernetes integration and WebContainer IDE architecture.
- Engine adapters and Spatial/Gaussian-splat rendering path.
- Stripe checkout-session creation and webhook signature verification.
- AI-PLAYGROUND provider/rate-limit/key-validation server.
- NPC-AI-SIM Gemini reasoning/vision/video endpoints and 3D/NPC modules.
- Expo/EAS mobile shell.
- Filesystem-writing Builder bridge.
- UpCloud/nginx/Docker deployment configuration exists in source.

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

DreamMakerHub's README presents proprietary/confidential commercial terms while the root `LICENSE` grants MIT rights to use, modify, distribute, sublicense and sell the Software. The scope must be corrected before commercial claims are made. NPC-AI-SIM currently has no declared GitHub license. Third-party dependency licensing must be inventoried separately, including PlayCanvas, Three.js, Gaussian Splatting, GLTF Transform, Gemini SDKs, WebContainers, Coder and Kubernetes components.

## Commercial readiness

### Sponsorship
The Founding Sponsor offer exists with monthly/quarterly/annual tiers, but no dedicated tier-aware sponsor payment flow is proven. Keep sponsorship framed as sponsorship/partnership rather than an investment or guaranteed financial return.

### Subscriptions
Stripe components exist, but public checkout, webhook persistence, database schemas and Auth metadata are not yet proven to form one canonical entitlement chain.

### AI cost control
AI-PLAYGROUND has rate limiting and Wonderland-key validation. DreamMakerHub `/api/build/stream` still lacks a comparable visible authentication/quota boundary and can trigger multiple model calls per build.

## P0 blockers before public commercial scale

1. Fix production environment deployment so `.env.example` cannot overwrite live secrets/configuration.
2. Verify actual Cloudflare DNS records for UpCloud migration.
3. Verify TLS certificate coverage for every nginx hostname.
4. Canonicalize Stripe entitlement state and paid-feature gates.
5. Make subscription/usage/limit fields server-controlled.
6. Require authenticated build access or enforce hard anonymous limits and metering.
7. Make AI/compute quota consumption atomic.
8. Keep service-role operations server-side.
9. Replace hard-coded public Stripe Payment Link with plan/interval-aware checkout.
10. Make Builder persistence deployment-safe and report success only after confirmed writes.
11. Resolve README-vs-MIT licensing contradiction.
12. Add a real sponsor payment/collection path.
13. Prove AI-PLAYGROUND production deployment and process restart.

## P1 blockers

1. Complete pipeline-to-engine graph compilation and dependency-output mapping.
2. Fix Coder workspace ID polling and verify Supabase -> Coder identity mapping.
3. Decide/document WebContainer vs Coder workspace boundaries.
4. Align mobile dependencies/EAS project IDs, update lockfiles and prove an APK build.
5. Connect mobile to a real authenticated build contract.
6. Add/verify `ws` runtime and HTTP upgrade handling in NPC-AI-SIM.
7. Verify NPC ownership before live bridging.
8. Replace simulated NPC visemes/audio with a provider-backed runtime.
9. Trace DreamMakerHub identity -> Wonderland key -> AI-PLAYGROUND -> provider -> usage/billing.
10. Complete SBOM/license/IP mapping.
11. Remove stale WonderPlay 3D deployment references after rename.
12. Reconcile stale deployment documentation with actual infrastructure.

## Next research chain

**UpCloud deployment reality -> DNS/TLS -> production process -> DreamMakerHub identity -> canonical billing -> Wonderland key -> AI-PLAYGROUND provider -> usage/billing; then NPC-AI-SIM HTTP upgrade -> live NPC brain -> DreamMakerHub SSE -> PlayCanvas.**

See `docs/research/2026-08-29-latest-findings.md` for today’s evidence.
