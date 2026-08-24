# DreamMakerHub Master Technical & Commercial Research Report — Current Snapshot

_Last verified: 2026-08-24_

> Historical evidence remains in `DREAMMAKERHUB_MASTER_RESEARCH_REPORT.md` and the dated `docs/research/` addenda. This file is the current consolidated snapshot because the existing historical master is maintained as a long-form record.

## Current verdict

DreamMakerHub is a substantial early-stage platform, not a simple mockup. It contains real AI transport, model routing, usage/realtime infrastructure, a multi-stage AI builder, Coder/Kubernetes workspace infrastructure, a browser-local WebContainer IDE, engine adapters, Spatial/Gaussian-splat integration, a real Expo/EAS mobile shell, and a separate native C++/Vulkan Android engine effort.

The project is nevertheless **not production-safe as one unified commercial product yet**. The largest remaining risks are billing/entitlement canonicalization, inconsistent AI access-control boundaries, incomplete pipeline execution, WonderPlay's simulated live-NPC loop, mobile API parity, native Android renderer defects, and unresolved licensing/IP boundaries across multiple engine repositories.

## Repository map

### `AI-WonderLand1/dreammakerhub.website`

Current `Master` commit: `4f03c21ac1a585b9b91f13d9a2d688d66548fc80` (`bug build error`, 2026-08-24).

Verified current capabilities:

- Real OpenRouter transport in `apps/web/core/ai/runModel.ts`.
- Fallback to `meta-llama/llama-3.3-70b-instruct:free` on selected provider failures.
- Authenticated `/api/chat` with premium-plan gating and usage logging.
- Realtime usage publication and `get_usage_summary()` in Supabase.
- Internal usage-ingest route protected by `USAGE_INGEST_KEY`.
- Multi-stage `/api/build/stream` builder: Architect → Builder → Reviewer → optional Runner.
- WonderBuild has materially expanded its block/rendering library.
- Real Coder/Kubernetes workspace infrastructure plus browser-local WebContainer IDE.
- Real engine adapter architecture and Spatial/Gaussian-splat integration.
- Real Expo/EAS mobile shell.

Critical current gaps:

- `/api/build/stream` still permits anonymous requests and does not visibly meter/rate-limit each multi-call build.
- `requirePaidAIUser` is misnamed: it checks authentication, not paid status.
- Billing state remains split among `user_profiles`, `profiles`, and `subscriptions` in the inspected code paths.
- Pipeline execution still requires a real provider/dataflow completion pass.
- Privileged engine/Supabase operations still need clean server/client separation.

### `AI-WonderLand1/AI-PLAYGROUND`

Current `main` is directly accessible. The workflow-template branch was merged into `main` on 2026-08-21.

Verified current capabilities:

- Real provider registry for OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together, Fireworks, DeepSeek, Perplexity, xAI and Google Gemini.
- Broad model-route registry across text, image, video, voice and embedding categories.
- Workflow-template and AI canvas work has been merged and reorganized into a dedicated Workflows experience.

Known gaps:

- Replicate and Hugging Face provider implementations remain explicit stubs.
- Browser/localStorage credential handling remains a production-security concern.
- Anthropic's `anthropic-dangerous-direct-browser-access` header is unnecessary for the server-side request path.
- End-to-end workflow execution still needs to be traced on current `main` rather than inferred from template definitions.

### `AI-WonderLand1/wonderplay-3D`

Current `main`: `aaf1f7bab02718b239e43c5597444fab4d1d8c2b`.

Verified current capabilities:

- Real Gemini NPC tactical reasoning, vision and video-analysis endpoints.
- Three.js/PlayCanvas-oriented 3D builder code.
- New builder component tree from the August 22 wiring commit.
- Asset/NPC tooling and WebSocket server code.

Known gaps:

- `src/App.tsx` still routes the public builder to the older `BuilderPage`.
- `/live-npc` uses simulated thinking and randomized viseme frames.
- Subscription routes are in-memory.
- Gemini API keys can be supplied directly in request bodies.
- `ws` is dynamically imported by the server but is not listed as a runtime dependency in `package.json`; this must be verified in the Bun lock/build path.
- API docs are still a placeholder route.

### `AI-WonderLand1/MOBILEAPP-VANGUARD-ENGINE`

Current `Master`: `052128c2dd1862a06b16b19977ecba5bca0809fa`.

This is a major new finding. It is a separate native C++20/23 engine/editor effort with:

- Actor/Component/SceneGraph architecture.
- Reflection registry.
- Vulkan 1.3 RHI/rendering code.
- Jolt Physics.
- Dear ImGui editor.
- Tracy profiling.
- Asset registry/mesh baking.
- Android native window/surface code.
- Android Gradle build workflow.
- Next.js Engine Architect Studio.

However, the Android renderer currently has concrete blockers:

- GLSL source strings are passed directly to `vkCreateShaderModule` as if they were SPIR-V.
- Swapchain extent fallback calls `ANativeWindow_getWidth/Height` without storing the return values, leaving local dimensions uninitialized.
- Generic Vulkan surface creation in `VulkanContext::CreateSurface()` is intentionally unresolved and comments describe the platform-integration conflict.
- The README claims syntax-level validation with API stubs, but full CMake/native build success is not independently proven.

### `AI-WonderLand1/vanguard-engine`

An older/parallel C++ engine lineage exists with graphics/editor commits through 2026-08-16. Its relationship to `MOBILEAPP-VANGUARD-ENGINE` is not yet proven by imports or explicit migration metadata.

## What is genuinely implemented today

- Server-side AI model transport.
- Multiple AI providers and model routing.
- Authenticated premium chat path.
- Usage event persistence and realtime usage summary.
- Multi-stage AI code generation/review.
- Real cloud workspace infrastructure using Coder/Kubernetes.
- Browser-local IDE runtime using WebContainers.
- Engine adapter framework and Spatial/Gaussian-splat path.
- Real native C++/Vulkan engine source and Android build configuration.
- Real Gemini NPC analysis services.
- Real mobile app packaging configuration.

## What remains scaffolding, simulated, duplicated, or unproven

- WonderPlay live-NPC thinking/viseme loop.
- WonderPlay in-memory subscriptions.
- WonderPlay public builder route still pointing to the older builder.
- Replicate/Hugging Face AI-PLAYGROUND providers.
- Mobile Expo builder fallback/demo path and API contract mismatch.
- Pipeline dependency-output execution and real provider bridge.
- BYOC localStorage "connected" state.
- Full native Android renderer execution/build proof.
- Canonical billing entitlement path.

## P0 blockers before real public commercial scale

1. Canonicalize billing tables and Stripe entitlement state.
2. Make subscription/limit fields server-controlled.
3. Replace or harden anonymous `/api/build/stream` access with quotas/rate limits and usage metering.
4. Make AI/compute quota consumption atomic.
5. Keep service-role operations strictly server-side.
6. Verify that every paid feature uses the same canonical entitlement source.

## P1 blockers

1. Complete pipeline execution/dataflow semantics.
2. Fix Coder workspace ID polling and verify Supabase→Coder identity mapping.
3. Decide and document WebContainer vs Coder workspace boundaries.
4. Connect mobile to a real authenticated build contract.
5. Wire WonderPlay live-NPC to a real provider-backed runtime and remove simulated visemes.
6. Fix native Android Vulkan shader/swapchain defects and prove an actual APK build.
7. Complete repository-wide SBOM/license/IP mapping.
8. Establish code-sharing/migration relationships among the three engine lineages before making unified-engine claims.

## Next research chain

**Stripe checkout → webhook → canonical entitlement → `/api/chat` and `/api/build/stream` → usage accounting → AI provider → artifact persistence → WebContainer/Coder workspace → realtime event → mobile/native engine parity.**

Unresolved dependencies will continue to be traced from source rather than inferred from UI, README claims, or marketing language.
