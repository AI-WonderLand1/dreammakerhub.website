# DreamMakerHub Master Technical & Commercial Research Report — Current Snapshot

_Last verified: 2026-08-28_

> Historical evidence remains in `DREAMMAKERHUB_MASTER_RESEARCH_REPORT.md` and the dated `docs/research/` addenda. This file is the current consolidated snapshot.

## Current verdict

DreamMakerHub is a substantial early-stage platform, not a simple mockup. It contains real AI transport/model routing, authenticated premium chat, usage/realtime infrastructure, a multi-stage AI builder, Coder/Kubernetes workspace infrastructure, a browser-local WebContainer IDE, engine adapters, Spatial/Gaussian-splat integration, a real Expo/EAS mobile shell, and separate native C++/Vulkan engine efforts.

It is **not production-safe as one unified commercial product yet**. The highest-risk areas remain canonical billing/entitlement, anonymous build-cost exposure, deployment-safe persistence, incomplete pipeline-to-engine execution, Coder workspace identity, mobile dependency/project identity, licensing/IP contradictions, and disconnected sponsorship payment collection. The NPC/3D repository was renamed to `AI-WonderLand1/NPC-AI-SIM` and is now directly visible to the connected GitHub installation.

## Repository map

### `AI-WonderLand1/dreammakerhub.website`

Current `Master` head observed on 2026-08-28 is `fb4f7a5862a01a623b1b712af5d505075c5baece`.

Verified:
- Real OpenRouter transport with free-model fallback.
- Authenticated premium chat plus usage/realtime infrastructure.
- Real multi-stage `/api/build/stream` AI generation.
- Direct pipeline-v1 AI runtime that calls `runModel`, performs constitutional checks, and emits pipeline status.
- Real Coder/Kubernetes workspace API integration and browser-local WebContainer IDE.
- Engine adapter architecture and Spatial/Gaussian-splat integration.
- Real Expo/EAS mobile shell and Android/iOS packaging configuration.
- Real Stripe Checkout Session endpoint and Stripe webhook signature verification.
- Published Founding Sponsorship program and GitHub funding metadata.
- Current package manifest includes `ws`, Stripe, Supabase, Coder/Kubernetes, WebContainer, PlayCanvas, Gaussian Splatting, Colyseus and WonderSpace IDE dependencies.

Current gaps:
- `/api/build/stream` is an older route (last modified July 21 in the inspected tree), accepts anonymous requests, makes multiple model calls, and does not visibly enforce per-build quota/rate limits or usage deduction. Reviewer omits the paid flag and therefore uses the default/free model path.
- Builder persistence is **not a no-op**. Current `engine/core/ai/bridge.ts` validates generated code and writes it with `writeFileSync` into `apps/web/app/(builder)/blocks`, returning a real path. However, `/api/build/stream` reports `Saved to blocks/ ✓` without checking the bridge status, and filesystem persistence is not automatically durable across serverless/container redeployments. The earlier report’s “manifestVisualBlock no-op” finding is corrected.
- `engine/core/ai/pipeline-v1/runtime/pipeline.ts` is real direct AI execution, but `engine/core/pipelines.ts` remains a separate incomplete bridge. It references an undefined/unimported `compilePipelineToGraph`, returns placeholder text from `getAIResponse`, returns expressions unchanged, and calls Base64 encoding “encryption.”
- `engine/core/execution/executor.ts` calls `graph.getAllNodes()` even though the current `ExecutionGraph` type exposes a `nodes` record; its dependency-output mapping is incomplete.
- `getAuthUser()` treats only Auth `app_metadata.plan === 'pro'` as paid and uses a relative server-side `fetch('/api/auth/session')` while swallowing failures to null.
- Stripe webhook writes `profiles.plan` and `subscriptions`, while inspected migration creates `user_profiles.subscription_plan`; no current path proves Auth `app_metadata.plan` is synchronized.
- Public checkout uses one hard-coded Stripe Payment Link instead of the dynamic plan/interval-aware checkout endpoint.
- `user_profiles` RLS permits owners to update the whole row, including subscription and usage-limit fields; these should be server-controlled.
- Sponsorship copy is published, but the sponsor document still says payment/contact links are to be added; GitHub funding metadata only points to Ko-fi and the website.
- README proprietary/confidential terms still conflict with the root MIT license.
- Recent commits repaired package.json syntax, Docker/Node skew, error-handler parsing, workflow branch references, and merge-conflict placement. Earlier package-syntax findings should be downgraded, but a real build must still be proven.
- Mobile dependency/EAS identity issues from the prior audit remain unresolved until a current build is verified.
- `CoderAPIWrapper.createWorkspace()` still appears to poll with a locally generated UUID instead of the actual Coder workspace ID returned by Coder.
- Current cross-repo NPC references were updated to `npc-ai-sim`; stale WonderPlay 3D URLs/env vars must still be audited.

### `AI-WonderLand1/AI-PLAYGROUND`

Current `main` head observed on 2026-08-21 is `8509c6b9b2b29d1a973eb5f00c92409e4581f37f`. The repository is now directly discoverable through the connected GitHub installation.

Verified:
- Express API with explicit CORS origin handling.
- Separate rate limits for templates, chat, and streaming.
- Wonderland-key validation before model calls.
- Stripe webhook mounted with raw-body handling.
- Real provider routing and streaming.
- Health endpoint and JSON API 404 handling.
- Provider adapters for OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together AI, Fireworks, DeepSeek, Perplexity, xAI and Google Gemini.
- Workflow-template/library cleanup and recent dependency updates.

Still incomplete:
- Replicate and Hugging Face provider entries remain explicit stubs: request builders return `{}` and parsers return an empty-response placeholder.
- The server requires a `wonderlandKey` for chat/stream calls. No current cross-repository source evidence proves DreamMakerHub’s authenticated user/session entitlement automatically receives and presents a valid Wonderland key.
- The AI-PLAYGROUND billing/usage model remains a separate contract from DreamMakerHub’s Supabase/Stripe entitlement system and needs explicit reconciliation before shared commercial use.

### `AI-WonderLand1/NPC-AI-SIM`

This repository was renamed from the previously tracked WonderPlay 3D project on 2026-08-28. Current head is `57383e4878f91a54e18b4eeed55d271669ed2eec`.

Verified:
- TypeScript/React application and Express server.
- Real Gemini-backed NPC tactical reasoning, vision and video analysis endpoints using structured JSON output.
- 3D builder components, GLTF tooling, PlayCanvas and Three.js dependencies.
- NPC dialogue, voice, animation and safety-related modules.
- A WebSocket server object and `/live-npc` connection handler code.

Important gaps:
- `package.json` lists `@types/ws` but not the `ws` runtime package, despite `server.ts` dynamically importing `ws`.
- The inspected server source creates `WebSocketServer({ noServer: true })`, but the current source evidence does not prove an HTTP upgrade handler calls `wss.handleUpgrade`. Therefore the DreamMakerHub -> `npc-ai-sim` live WebSocket path is still unresolved.
- DreamMakerHub’s `/api/npc/live` is now a real authenticated SSE bridge to `https://npc-ai-sim.dreammakerhub.website/live-npc?id=...`, but the route does not visibly verify that the requested `npcId` belongs to the authenticated user before connecting.
- Live viseme generation remains simulated/randomized in the inspected WebSocket code; provider-backed NPC intelligence exists separately.
- Subscription state in `SubscriptionContext.tsx` is demo-grade: the server stores subscriptions in an in-memory object keyed by email and accepts the requested tier from the request body. It is not the canonical commercial billing system.
- GitHub repository metadata currently reports no license.

### Vanguard repositories

Earlier evidence remains: `MOBILEAPP-VANGUARD-ENGINE` and `vanguard-engine` expose broad C++20/23 Actor/Component/SceneGraph, reflection, Vulkan 1.3, Jolt, Dear ImGui, Tracy, and Next.js Engine Architect Studio architecture. Native blockers previously identified include GLSL-to-SPIR-V handling and Android swapchain/surface issues. These repositories are not currently exposed through the connected repository list, so no new source-level claims were made today.

## Genuine implementation vs scaffolding

### Genuinely implemented / substantially real
- Server-side OpenRouter transport and model fallback.
- Authenticated premium chat and usage/realtime infrastructure.
- Multi-stage Architect/Builder/Reviewer AI generation.
- Direct pipeline-v1 AI runtime.
- Coder/Kubernetes workspace API integration.
- Browser-local WebContainer IDE architecture.
- Engine adapters and Spatial/Gaussian-splat path.
- Stripe checkout-session creation and webhook signature verification.
- Expo/EAS project configuration and mobile shell.
- Current filesystem-writing `manifestVisualBlock` bridge.
- AI-PLAYGROUND provider/rate-limit/key-validation server.
- NPC-AI-SIM Gemini reasoning/vision/video endpoints and 3D/NPC modules.
- Founding sponsorship documentation.

### Scaffolding / incomplete / unsafe for commercial scale
- Build endpoint authentication/quota/usage enforcement.
- Deployment-safe Builder artifact persistence and success/error handling.
- Pipeline-to-engine compiler and graph dependency mapping.
- Canonical Stripe entitlement synchronization.
- Client-controlled subscription/quota fields under current RLS.
- Dedicated sponsor payment collection.
- Proprietary-vs-MIT licensing boundary.
- Mobile dependency/EAS identity alignment and verified APK build.
- Coder workspace ID mapping.
- NPC-AI-SIM live WebSocket upgrade/runtime and non-simulated viseme/audio loop.
- Cross-repository Wonderland-key/AI-PLAYGROUND contract.

## Licensing / IP status

DreamMakerHub’s README presents proprietary/confidential commercial terms while the root `LICENSE` contains MIT rights to use, modify, distribute, sublicense and sell the Software. The scope of the MIT license must be explicitly corrected before the project is marketed as proprietary. NPC-AI-SIM currently reports no GitHub license. Third-party engine/rendering dependencies must be inventoried separately from first-party code, including PlayCanvas, Three.js, Gaussian Splatting, GLTF Transform, Gemini SDKs, WebContainers, Coder and Kubernetes components.

## Commercial readiness

### Sponsorship
The sponsorship program is ready as an offer document, with Dreamer/Creator/Architect/Studio/Enterprise tiers and monthly/quarterly/annual pricing. It is **not yet connected to a dedicated sponsor payment flow**. The next practical step is one tier-aware checkout/contact path, followed by a sponsor landing page and campaign-specific tracking.

### Subscriptions
The subscription architecture has real Stripe components, but public checkout, webhook persistence, user profiles and Auth metadata are not yet proven to form one canonical entitlement chain.

### AI cost control
AI-PLAYGROUND has request rate limits and Wonderland-key validation. DreamMakerHub’s `/api/build/stream` still lacks a comparable visible authentication/quota boundary and can trigger multiple provider calls per build.

## P0 blockers before public commercial scale

1. Canonicalize billing tables and Stripe entitlement state.
2. Make subscription/limit fields server-controlled.
3. Require authenticated build access or explicitly meter anonymous builds with hard limits.
4. Make AI/compute quota consumption atomic.
5. Keep service-role operations server-side.
6. Make every paid feature read one canonical entitlement source.
7. Replace the hard-coded public Stripe Payment Link with plan/interval-aware server checkout.
8. Make Builder persistence deployment-safe and only report success when the write succeeds.
9. Resolve README-vs-root-MIT licensing contradiction.
10. Add a real sponsor payment/collection path.

## P1 blockers

1. Complete pipeline-to-engine graph compilation and dependency-output mapping.
2. Fix Coder workspace ID polling and verify Supabase -> Coder identity mapping.
3. Decide/document WebContainer vs Coder workspace boundaries.
4. Align Expo/React Native versions and reconcile EAS project IDs; update lockfiles and prove an APK build.
5. Connect mobile to a real authenticated build contract.
6. Verify NPC-AI-SIM WebSocket upgrade handling and add the `ws` runtime dependency if that server remains the deployment target.
7. Verify `npcId` ownership in the live bridge.
8. Replace simulated NPC visemes/audio behavior with a provider-backed runtime path.
9. Trace DreamMakerHub authenticated identity -> Wonderland key -> AI-PLAYGROUND -> provider -> usage/billing.
10. Complete SBOM/license/IP mapping across all first- and third-party components.
11. Remove stale WonderPlay 3D references after the repository rename.
12. Keep documentation synchronized with repository moves and deleted packages.

## Next research chain

**DreamMakerHub -> NPC-AI-SIM live runtime -> WebSocket upgrade -> provider-backed NPC brain -> DreamMakerHub SSE -> PlayCanvas feed; and separately DreamMakerHub identity -> Wonderland key -> AI-PLAYGROUND -> provider -> usage/billing.**

See `docs/research/2026-08-28-latest-findings.md` for today’s evidence.
