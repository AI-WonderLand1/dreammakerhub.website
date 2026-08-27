# DreamMakerHub Master Technical & Commercial Research Report — Current Snapshot

_Last verified: 2026-08-27_

> Historical evidence remains in `DREAMMAKERHUB_MASTER_RESEARCH_REPORT.md` and the dated `docs/research/` addenda. This file is the current consolidated snapshot.

## Current verdict

DreamMakerHub is a substantial early-stage platform, not a simple mockup. It contains real AI transport/model routing, authenticated premium chat, usage/realtime infrastructure, a multi-stage AI builder, Coder/Kubernetes workspace infrastructure, a browser-local WebContainer IDE, engine adapters, Spatial/Gaussian-splat integration, a real Expo/EAS mobile shell, and separate native C++/Vulkan engine efforts.

It is **not production-safe as one unified commercial product yet**. The highest-risk areas are canonical billing/entitlement, anonymous build-cost exposure, false-success build persistence, incomplete pipeline-to-engine execution, Coder workspace identity, mobile dependency/project identity, licensing/IP contradictions, and disconnected sponsorship payment collection.

## Repository map

### `AI-WonderLand1/dreammakerhub.website`

Current connected `Master` tree was last observed at merge `d480925a29c1c9b13ed972acaae6e01275ac8c38` before today's research commit; today's research addendum is now committed on `Master` as `5e23a814edbd7deba9623b7396a9805805059ceb`.

Verified:
- Real OpenRouter transport with free-model fallback.
- Authenticated premium chat plus usage/realtime infrastructure.
- Real multi-stage `/api/build/stream` AI generation.
- Direct pipeline-v1 AI runtime that calls `runModel`, performs constitutional checks, and emits pipeline status.
- Real Coder/Kubernetes workspace infrastructure and browser-local WebContainer IDE.
- Engine adapter architecture and Spatial/Gaussian-splat integration.
- Real Expo/EAS mobile shell and Android/iOS packaging configuration.
- Real Stripe Checkout Session endpoint and Stripe webhook signature verification.
- Published Founding Sponsorship program and GitHub funding metadata.

Newly verified gaps:
- `/api/build/stream` accepts anonymous requests, makes multiple model calls, and does not visibly enforce per-build quota/rate limits or usage deduction. Reviewer omits the paid flag and therefore uses the default/free model path.
- The build Runner reports success but does not persist output: `manifestVisualBlock` currently returns its first argument unchanged; `route.ts` then reads `.path` from the returned string. `savedPath` therefore becomes undefined and no block file is written.
- `engine/core/ai/pipeline-v1/runtime/pipeline.ts` is real direct AI execution, but `engine/core/pipelines.ts` is a separate incomplete bridge. It references an undefined/unimported `compilePipelineToGraph`, returns placeholder text from `getAIResponse`, returns expressions unchanged, and calls Base64 encoding “encryption.”
- `engine/core/execution/executor.ts` calls `graph.getAllNodes()` even though the current `ExecutionGraph` type only exposes a `nodes` record. Its input resolver explicitly does not map dependency outputs.
- `getAuthUser()` treats only Auth `app_metadata.plan === 'pro'` as paid and performs a relative server-side `fetch('/api/auth/session')` while swallowing failures to null.
- Stripe webhook writes `profiles.plan` and `subscriptions`, while migration `009_create_profiles_and_projects.sql` creates `user_profiles.subscription_plan`; no inspected path proves Auth `app_metadata.plan` is synchronized.
- The public checkout page uses one hard-coded Stripe Payment Link instead of the dynamic `/api/subscription/subscribe` endpoint, so selected plan/annual interval are not proven to reach Stripe correctly.
- `user_profiles` RLS permits owners to update their whole row, including subscription and usage-limit fields. These fields are not clearly server-controlled.
- Sponsorship copy is published, but `SPONSORSHIP.md` still says the sponsorship/payment link and business contact are “To be added.” `.github/FUNDING.yml` only points to Ko-fi and the website; no tier-aware sponsor checkout is wired.
- README now presents proprietary/confidential commercial terms while the root `LICENSE` grants MIT rights. This is a direct licensing contradiction.
- Commit `28cf239...` changed mobile to Expo `^53.0.27`, React Native `^0.72.17`, and React `19.1.0` without updating the package-lock. Expo's SDK 53 compatibility matrix targets React Native 0.79 and React 19.0.0, so the manifest is internally misaligned.
- Root `app.json` and `apps/mobile/app.json` use different EAS project IDs while sharing the same Android package ID `com.dreammakerhub.website`.
- `CoderAPIWrapper.createWorkspace()` stores a locally generated UUID and then polls Coder using that local UUID instead of the actual Coder workspace ID returned by the create call.

### `AI-WonderLand1/AI-PLAYGROUND`

The connected GitHub installation does **not currently expose this repository directly in the repository list**, so no new source-level claims were made today. Earlier verified evidence remains: real provider registry, workflow-template work, CORS/rate limits, Wonderland-key validation, and Stripe webhook persistence; Replicate and Hugging Face remain explicit provider stubs in the previously inspected source.

### `AI-WonderLand1/wonderplay-3D`

The connected GitHub installation does **not currently expose this repository directly in the repository list**, so no new source-level claims were made today. Earlier verified evidence remains: real Gemini NPC tactical/vision/video endpoints, 3D builder components, WebSocket server code, and the unresolved simulated live-NPC loop/runtime wiring.

### Vanguard repositories

Earlier evidence remains: `MOBILEAPP-VANGUARD-ENGINE` and `vanguard-engine` expose broad C++20/23 Actor/Component/SceneGraph, reflection, Vulkan 1.3, Jolt, Dear ImGui, Tracy, and Next.js Engine Architect Studio architecture. `MOBILEAPP-VANGUARD-ENGINE` has verified native blockers including GLSL-to-SPIR-V handling and Android swapchain/surface issues. These repositories are not currently exposed through the connected repository list, so no new source-level claims were made today.

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
- Founding sponsorship documentation.

### Scaffolding / incomplete / unsafe for commercial scale
- Build Runner persistence (`manifestVisualBlock` no-op / false-success event).
- Pipeline-to-engine compiler and graph executor integration.
- Canonical Stripe entitlement synchronization.
- Client-controlled subscription/quota fields under current RLS.
- Anonymous build cost exposure and missing quota enforcement.
- Dedicated sponsor payment collection.
- Proprietary-vs-MIT licensing boundary.
- Mobile Expo/RN dependency alignment and EAS project identity.
- Coder workspace ID mapping.
- WonderPlay live-NPC production loop, based on prior direct inspection.

## Licensing / IP status

The repository now contains conflicting commercial statements. `README.md` presents proprietary/confidential terms while root `LICENSE` contains the MIT License, including rights to use, copy, modify, publish, distribute, sublicense, and sell the Software. The scope of the MIT license therefore needs explicit correction before the project is marketed as proprietary or sponsors are told what rights they receive. Third-party dependencies must also be inventoried separately from first-party code.

## Commercial readiness

### Sponsorship
The public sponsorship program is ready as an offer document, with Dreamer/Creator/Architect/Studio/Enterprise tiers and monthly/quarterly/annual pricing. It is **not yet connected to a dedicated sponsor payment flow**. GitHub funding metadata currently points to Ko-fi (`wonderingtribe`) and the project website.

### Subscriptions
The subscription architecture has real Stripe components, but the public checkout bypasses the dynamic server endpoint and the webhook/entitlement records are split across `profiles`, `subscriptions`, `user_profiles`, and Auth metadata.

### AI cost control
The normal chat path has authentication and usage infrastructure, but `/api/build/stream` can execute multiple model calls without a visible per-build quota/rate-limit gate. This is a direct cost-abuse risk until fixed.

## P0 blockers before public commercial scale

1. Canonicalize billing tables and Stripe entitlement state.
2. Make subscription/limit fields server-controlled.
3. Require authenticated build access or explicitly meter anonymous builds with hard limits.
4. Make AI/compute quota consumption atomic.
5. Keep service-role operations server-side.
6. Make every paid feature read one canonical entitlement source.
7. Replace the hard-coded public Stripe Payment Link with plan/interval-aware server checkout.
8. Fix the build Runner so “save” actually persists and returns a real path.
9. Resolve the README-vs-root-MIT licensing contradiction.
10. Add a real sponsor payment/collection path before promoting “sponsorship available” as immediately payable.

## P1 blockers

1. Complete pipeline-to-engine graph compilation and dependency-output mapping.
2. Fix Coder workspace ID polling and verify Supabase -> Coder identity mapping.
3. Decide/document WebContainer vs Coder workspace boundaries.
4. Align Expo/React Native versions and reconcile EAS project IDs; update lockfiles and prove an APK build.
5. Connect mobile to a real authenticated build contract.
6. Wire WonderPlay live-NPC to a provider-backed runtime and remove simulated visemes.
7. Complete SBOM/license/IP mapping.
8. Prove code-sharing/migration relationships among engine lineages.
9. Remove stale README/NPC-sim claims and keep documentation synchronized with deleted packages.
10. Runtime-test server-side auth resolution in `/api/build/stream` and replace the relative-fetch helper with direct server auth if the test confirms silent fallback.

## Next research chain

**Canonical entitlement -> quota enforcement -> build persistence -> pipeline-to-engine compiler -> mobile dependency/build state -> EAS project identity -> WonderPlay live-NPC runtime -> cross-repository API contracts -> licensing/SBOM.**

See `docs/research/2026-08-27-latest-findings.md` for today's detailed evidence.
