# DreamMakerHub Master Technical & Commercial Research Report — Current Snapshot

_Last verified: 2026-08-26_

> Historical evidence remains in `DREAMMAKERHUB_MASTER_RESEARCH_REPORT.md` and the dated `docs/research/` addenda. This file is the current consolidated snapshot.

## Current verdict

DreamMakerHub is a substantial early-stage platform, not a simple mockup. It contains real AI transport, model routing, usage/realtime infrastructure, a multi-stage AI builder, Coder/Kubernetes workspace infrastructure, a browser-local WebContainer IDE, engine adapters, Spatial/Gaussian-splat integration, a real Expo/EAS mobile shell, and separate native C++/Vulkan Vanguard engine efforts.

It is **not production-safe as one unified commercial product yet**. The highest-risk areas are billing/entitlement canonicalization, anonymous build-cost exposure, stale unified-AI routing, Coder workspace identity, incomplete pipeline execution, WonderPlay's simulated live-NPC loop, mobile API parity, native Android renderer defects, and unresolved licensing/IP boundaries across multiple engine repositories.

## Repository map

### `AI-WonderLand1/dreammakerhub.website`

Current `Master`: `70c0346b64efa41625c9c3bc658701efabce0f36` (2026-08-25). The latest commit revised README commercial terms.

Verified:
- Real OpenRouter transport with free-model fallback.
- Authenticated premium chat plus usage/realtime infrastructure.
- Real multi-stage `/api/build/stream` builder.
- Real Coder/Kubernetes workspace infrastructure and browser-local WebContainer IDE.
- Engine adapter architecture and Spatial/Gaussian-splat integration.
- Real Expo/EAS mobile shell.
- Real Stripe checkout API and Stripe webhook code.
- Root `package.json` currently declares `ws` as a production dependency, so the root monorepo has the WebSocket runtime even though the standalone WonderPlay package does not.

Newly verified gaps:
- `/api/build/stream` accepts anonymous requests, performs multiple model calls, and does not visibly enforce per-build quotas/rate limits or usage deduction. The Reviewer call does not pass the paid flag and therefore uses the free/default model path.
- `getAuthUser()` treats only Auth `app_metadata.plan === 'pro'` as paid. The Stripe webhook writes `profiles.plan` and `subscriptions`; the inspected path does not prove Auth metadata is updated.
- `getAuthUser()` also performs a relative `fetch('/api/auth/session')` even though it is imported by the server-side build route; because errors are swallowed and returned as `null`, this path must be runtime-tested for silent fallback to anonymous/free status.
- Public subscription and checkout UI use one hard-coded Stripe Payment Link instead of the dynamic `/api/subscription/subscribe` endpoint, so selected plan/annual interval are not proven to reach Stripe correctly.
- Free-plan ensure writes `profiles.plan`, while migration `009_create_profiles_and_projects.sql` creates `user_profiles.subscription_plan`; the inspected migration does not establish the `profiles.plan` schema assumed by `ensure`.
- Billing state is split across `user_profiles.subscription_plan`, `profiles.plan`, `subscriptions`, and Auth `app_metadata.plan`.
- `unified-ai/route.ts` still has a default chat path to deleted `/api/spirit-guide/chat`; newer Spirit Guide routing correctly points to `/api/chat`. This is a concrete stale-route regression.
- `CoderAPIWrapper.createWorkspace()` stores a locally generated UUID and then polls Coder using that local UUID instead of the Coder workspace ID returned by the create call.
- The 2026-08-25 README revision now declares the website/source proprietary and confidential, but the repository still contains a root MIT `LICENSE`. This is a direct licensing contradiction that must be resolved before commercial distribution or sponsor representations.
- The same README still contains stale `npc-sim` references even though the NPC simulation package was removed in earlier cleanup. Documentation needs reconciliation with the current implementation.

### `AI-WonderLand1/AI-PLAYGROUND`

Current `main` is directly accessible; workflow-template work was merged 2026-08-21.

Verified:
- Real provider registry for OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together, Fireworks, DeepSeek, Perplexity, xAI and Google Gemini.
- Workflow-template/AI canvas work merged into the main experience.
- CORS allowlisting, chat/stream/template rate limits, Wonderland-key validation, and raw-body Stripe webhook verification.
- Real Stripe webhook consumer and Supabase subscription persistence.

Known gaps:
- Replicate and Hugging Face providers are explicit stubs: empty request builders and empty-response parsers.
- The inspected AI-PLAYGROUND server has a Stripe webhook consumer but no standalone checkout-session creation route; commercial checkout remains centered in DreamMakerHub unless another integration is proven.
- `ApiKeysView.tsx` stores API-key records in browser `localStorage` and locally generates token-shaped strings. It also contains several `sk-or-v1-...`-shaped fixtures. Their live validity is unproven; if any are real they must be rotated.
- Anthropic's browser-access header is present on a server-side request path and is unnecessary there.
- `package.json` confirms this repo is a separate Vite/Express application rather than a workspace package of DreamMakerHub, so cross-repo provider/auth/billing contracts must be treated as integration boundaries, not shared runtime modules.

### `AI-WonderLand1/wonderplay-3D`

Current `main`: `aaf1f7b` (2026-08-22).

Verified:
- Real Gemini NPC tactical reasoning, vision and video analysis.
- Three.js/PlayCanvas-oriented 3D builder code.
- New builder component tree and asset/NPC tooling.
- WebSocket server code.

Known gaps:
- Public `/builder` still routes to the older `BuilderPage`.
- `/live-npc` contains simulated thinking/randomized visemes; full provider-backed dialogue is not proven end-to-end.
- Subscription routes are in-memory.
- Gemini API keys may be supplied directly in request bodies.
- The standalone `wonderplay-3D/package.json` declares `@types/ws` only and does not declare the `ws` runtime package; the server's WebSocket path therefore needs an explicit runtime dependency/build verification even though the parent DreamMakerHub monorepo declares `ws`.
- Full HTTP upgrade wiring for the `noServer` WebSocket instance is not proven.

### Vanguard repositories

`MOBILEAPP-VANGUARD-ENGINE` and `vanguard-engine` both expose the same broad C++20/23 Actor/Component/SceneGraph, reflection, Vulkan 1.3, Jolt, Dear ImGui, Tracy, and Next.js Engine Architect Studio architecture. This strongly indicates a shared/duplicated lineage, but no explicit migration manifest or cross-repository ancestry proof was found. Treat them as parallel lineages until ancestry is traced.

`MOBILEAPP-VANGUARD-ENGINE` has concrete native blockers: GLSL is passed directly to `vkCreateShaderModule` instead of SPIR-V; Android swapchain extent fallback does not store `ANativeWindow_getWidth/Height` return values; generic Vulkan surface creation remains unresolved; and full native CMake/APK build success is not independently proven.

## Genuine implementation vs scaffolding

Genuinely implemented: server-side AI transport, multiple providers, authenticated premium chat, usage/realtime infrastructure, multi-stage AI generation/review, Coder/Kubernetes workspaces, WebContainer IDE, engine adapters, Spatial/Gaussian-splat path, Gemini NPC analysis, mobile packaging, and real Stripe webhook persistence.

Still scaffolding/simulated/unproven: WonderPlay live-NPC loop, WonderPlay in-memory subscriptions, old public builder route, Replicate/Hugging Face providers, mobile build API parity, pipeline dependency-output execution, browser/localStorage API-key management as a secure credential system, full native Android renderer execution, canonical billing entitlement, and the stale unified-chat route.

## Licensing / IP status

The repository now contains conflicting commercial statements. Commit `70c0346` changed `README.md` from an MIT-style statement to proprietary/confidential commercial terms, while the root `LICENSE` file still contains the MIT License. The scope of the MIT license therefore needs explicit correction before the project is marketed as proprietary or sponsors are told what rights they receive. Third-party dependencies also include PlayCanvas, Three.js, Gaussian Splatting, GLTF Transform, WebContainer, Supabase, Stripe, and other libraries whose licenses must be inventoried separately from first-party code.

## P0 blockers before public commercial scale

1. Canonicalize billing tables and Stripe entitlement state.
2. Make subscription/limit fields server-controlled.
3. Replace/harden anonymous `/api/build/stream` with quotas, rate limits and usage metering.
4. Make AI/compute quota consumption atomic.
5. Keep service-role operations server-side.
6. Make every paid feature read one canonical entitlement source.
7. Replace hard-coded public Stripe Payment Links with plan/interval-aware server checkout.
8. Resolve the README-vs-root-MIT licensing contradiction before commercial licensing/sponsorship claims.

## P1 blockers

1. Complete pipeline execution/dataflow semantics.
2. Fix Coder workspace ID polling and verify Supabase -> Coder identity mapping.
3. Decide/document WebContainer vs Coder workspace boundaries.
4. Connect mobile to a real authenticated build contract.
5. Wire WonderPlay live-NPC to a provider-backed runtime and remove simulated visemes.
6. Fix native Android Vulkan shader/swapchain defects and prove an APK build.
7. Complete SBOM/license/IP mapping.
8. Prove code-sharing/migration relationships among engine lineages.
9. Remove stale `/api/spirit-guide/chat` references from unified chat routing.
10. Runtime-test server-side auth resolution in `/api/build/stream` and replace the relative-fetch helper with direct server auth if the test confirms silent fallback.
11. Reconcile stale README/NPC-sim claims with deleted packages and current architecture.
12. Add/verify `ws` as a runtime dependency in the standalone WonderPlay deployment if its WebSocket server remains deployed independently.

## Next research chain

**License scope -> Stripe UI selection -> dynamic checkout API -> Stripe webhook -> canonical entitlement -> Auth/plan gate -> `/api/chat` and `/api/build/stream` -> usage accounting -> AI provider -> artifact persistence -> WebContainer/Coder workspace -> realtime event -> WonderPlay NPC runtime -> mobile/native engine parity.**

See `docs/research/2026-08-26-latest-findings.md` for today's detailed evidence and unresolved dependencies.
