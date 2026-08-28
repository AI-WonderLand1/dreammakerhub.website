# DreamMakerHub Deep-Dive Addendum — 2026-08-24

## Executive update

This run re-verified the current `Master` branch of `dreammakerhub.website`, the current `main` branch of `npc-ai-sim`, and the current `main` branch of `AI-PLAYGROUND`. It also surfaced two additional AI-WonderLand repositories that materially change the mobile/custom-engine assessment: `MOBILEAPP-VANGUARD-ENGINE` and `vanguard-engine`.

The strongest new conclusion is that the project now has a **real, separate native C++/Vulkan engine effort for Android** in `MOBILEAPP-VANGUARD-ENGINE`. This is substantially more than the Expo mobile shell previously documented, but the Android renderer still contains source-level blockers that prevent us from calling it a production-ready mobile engine.

## 1. dreammakerhub.website — current branch changed materially since the prior report

### Latest commit state

`Master` currently points to commit `4f03c21ac1a585b9b91f13d9a2d688d66548fc80` (`bug build error`, 2026-08-24 01:56 UTC). The commit removes a large amount of dead/duplicate builder and Spirit Guide/sandbox code and is followed by a real-model/fallback change in `runModel`.

The latest commit's diff reports 203 additions and 1,170 deletions, so older source-level conclusions about removed routes/components must not be treated as current implementation evidence.

### Real AI provider path is now explicit

`apps/web/core/ai/runModel.ts` now performs a real POST to OpenRouter's chat-completions endpoint. It normalizes `openrouter/` model IDs, uses `OPENROUTER_API_KEY` or an explicitly supplied user key, returns provider errors, and automatically falls back to `meta-llama/llama-3.3-70b-instruct:free` for 402/403/404/429 responses when a requested model is unavailable.

This materially downgrades the old "empty runModel stub" finding: the website has a genuine AI transport layer. The remaining issue is commercial control and whether every caller is correctly authorized and metered.

### Important commercial consequence of the fallback

The fallback is useful for resilience, but a paid/high-capability request can silently be served by a free default model after certain provider failures. That should be surfaced to the product layer if model capability is part of a paid-plan promise; otherwise the user may receive a materially different model than requested without an explicit signal.

## 2. Public AI chat is now real and has plan gating

`apps/web/app/api/chat/route.ts` authenticates the caller, resolves the selected model, checks `user_profiles.subscription_plan` for premium models, calls OpenRouter directly, and records token/API/compute usage through `logUsage`.

The paid-plan set is explicitly `pro`, `team`, and `enterprise`.

This is stronger than the older report's generic "AI route exists" classification: the current chat route has a concrete paid/free model gate and usage logging.

However, the separate `apps/web/app/api/ai/auth.ts` helper named `requirePaidAIUser` still only checks that the caller is authenticated. Its name is misleading: it does not itself verify a paid plan. Any route using that helper must be audited independently.

## 3. Usage/realtime billing infrastructure is real

`apps/web/lib/usage/log.ts` writes usage events with a server-side Supabase service-role client. Supported usage actions include API calls, AI tokens, IDE sessions, runtime minutes, compute credits and storage bytes.

`apps/web/app/api/usage/ingest/route.ts` provides an internal metering API protected by a constant-time comparison of `x-internal-key` against `USAGE_INGEST_KEY`. It validates user/project IDs and caps incoming quantities before inserting usage records with the service-role client.

`supabase/migrations/20260823_realtime_usage.sql` adds `usage_logs` and `user_profiles` to the Supabase realtime publication, adds a `(user_id, created_at DESC)` index, and exposes a `SECURITY DEFINER` `get_usage_summary()` function for the authenticated user's current billing period. The summary aggregates API calls, tokens, compute credits, runtime minutes, project count, storage, and recent activity.

This establishes a credible usage-dashboard/realtime foundation. It does **not** by itself prove atomic quota consumption; the separate plan-limit code still needs that audit.

## 4. The public build route is still stale relative to the latest AI work

`apps/web/app/api/build/stream/route.ts` remains a real multi-stage builder: Architect → Builder → Reviewer → optional Runner. It calls `runModel`, supports website/game/component/PlayCanvas/WonderSpace/3D-assets/spatial output, and streams progress through SSE.

But the inspected file itself is modified July 21, while the current repository has August 23–24 AI changes around `runModel` and `/api/chat`. The build route still permits anonymous requests, treats anonymous users as Free, performs up to three model calls, and does not itself call `logUsage` or a rate limiter.

Therefore the current system has **two materially different AI access-control patterns**:

- `/api/chat`: authenticated + premium plan gate + usage logging.
- `/api/build/stream`: anonymous allowed + no direct usage logging/rate limiting in the inspected route.

This is now the clearest P0/P1 commercial inconsistency in the website.

## 5. WonderBuild has been consolidated toward one hub

Recent commits on `Master` show that `/wonder-build` is being treated as the template library/builder hub, with `/wonder-build/templates` redirected to the hub and builder Design/Code/Preview tabs driven by URL state. A further commit added 37 marketing/form/layout blocks with renderers, including testimonial, FAQ, comparison, event, multi-step form, booking, login/register, OTP, filters, uploads, tabs, modal, sticky CTA, split-screen, masonry, bento and hero-split blocks.

This is positive evidence of increasing actual builder breadth rather than merely marketing UI.

## 6. AI-PLAYGROUND is now directly accessible and its workflow branch was merged

The organization currently exposes `AI-WonderLand1/AI-PLAYGROUND` directly. Recent commits show the workflow-template branch was merged into `main` on 2026-08-21, followed by UI cleanup that moved canvas templates to a dedicated Workflows page.

The current provider registry contains real request/response builders for OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together AI, Fireworks, DeepSeek, Perplexity, xAI and Google Gemini.

Replicate and Hugging Face remain explicit stubs: their provider builders return `{}` and their response parsers return `Empty response received.`

The Anthropic provider still adds `anthropic-dangerous-direct-browser-access` to a server-side request. This header is unnecessary in a server-to-server path and should be removed unless a documented compatibility reason exists.

The current model-route table is broad and includes text, image, video, voice and embedding identifiers. The presence of a model ID in the registry does not by itself prove that the upstream provider is live; the provider implementation and configured credentials still determine actual availability.

## 7. NPC AI SIM — current public route is still the older builder

The current `npc-ai-sim` `main` branch is at `aaf1f7bab02718b239e43c5597444fab4d1d8c2b` after an August 22 README update and 3D-wiring commit.

`src/App.tsx` still routes `/builder` and `/builder/:templateId` directly to the older `BuilderPage.tsx`. It keeps subscription state as a local React boolean and has an API Docs route whose content is literally `Coming soon...`.

So despite the newer builder component tree added by the 3D-wiring commit, the root application is still demonstrably wired to the older builder. The newer builder components should be treated as an **implemented but not yet canonical public route** until the route/import relationship changes.

## 8. NPC AI SIM — Gemini NPC APIs are real, but the live NPC loop is still simulated

`server.ts` contains real Gemini-backed endpoints for NPC tactical reasoning, image perception, and video reconnaissance using structured JSON response schemas.

However, the server's `/live-npc` WebSocket implementation still sends randomized viseme frames on a 100 ms interval and explicitly describes the thinking/responding behavior as simulated. The subscription endpoints are also in-memory JavaScript objects keyed by email.

The package lists `@types/ws` but not the `ws` runtime package even though `server.ts` dynamically imports `ws`. That is a concrete packaging/deployment dependency that must be verified against the Bun lockfile and actual build environment.

The server also accepts `apiKey` directly from browser request bodies for Gemini calls. That is not a safe default for a hosted commercial service; it should be replaced with server-owned credentials or a deliberately authenticated BYOK flow.

## 9. New repository discovery — MOBILEAPP-VANGUARD-ENGINE

The organization exposes a separate `AI-WonderLand1/MOBILEAPP-VANGUARD-ENGINE` repository. Its current `Master` branch is at commit `052128c2dd1862a06b16b19977ecba5bca0809fa` with the message `Minimal Vulkan Android renderer - no external deps` on 2026-08-20.

This repository is materially relevant to the earlier "custom Unreal Engine 5" question and to mobile integration.

### Verified implemented architecture

`README.md` describes a custom C++20/23 engine/editor built from scratch, intentionally mirroring an Unreal-style Actor/Component architecture without UE code. It includes:

- `Vanguard::Actor` / `Vanguard::Component` / `SceneGraph` world model
- macro-based reflection registry
- stateless Vulkan 1.3 render graph
- Jolt Physics fixed-timestep simulation
- Dear ImGui editor and ImGuizmo
- Tracy profiling
- asset registry and mesh baking
- Next.js Engine Architect Studio

`CMakeLists.txt` includes actual engine translation units for Core, Reflection, Scene, Physics, Vulkan RHI, Platform, Asset, and RenderGraph components.

`Source/RHI/VulkanContext.cpp` contains real Vulkan instance/device/queue/command-pool/render-pass setup, physical-device selection, swapchain hooks, and synchronization2/dynamic-rendering feature setup.

`Source/Platform/Android/WindowAndroid.cpp` contains actual Android `ANativeWindow` lifecycle handling, touch input conversion, and `vkCreateAndroidSurfaceKHR` surface creation.

The repository also contains an Android GitHub Actions workflow that installs JDK 17, Android SDK API 34, NDK r27, and builds `Platform/Android` with Gradle, then uploads the debug APK artifact.

### Critical Android renderer finding

`Platform/Android/app/src/main/cpp/vulkan_renderer.cpp` is **not yet a production-ready Vulkan renderer** even though it contains substantial real Vulkan setup.

It creates a Vulkan instance, Android surface, physical/logical device, swapchain, image views and render pass. But its shader path defines GLSL source strings and passes those source strings directly to `vkCreateShaderModule` as if they were SPIR-V binary words. Vulkan shader modules require valid SPIR-V; raw GLSL text cannot be supplied this way.

The same file also contains an apparent source-level bug in the extent fallback: `ANativeWindow_getWidth(g_app->window);` and `ANativeWindow_getHeight(g_app->window);` are called without storing return values, leaving the local `width`/`height` variables uninitialized before they are used to compute the swapchain extent.

These are concrete implementation blockers, not merely missing polish.

### Additional engine-layer blocker

`Source/RHI/VulkanContext.cpp::CreateSurface()` explicitly contains comments describing a design conflict and does not create the surface itself. The Android-specific window class can create a surface, but the generic Vulkan context still expects platform integration that is not cleanly wired at this layer.

`WindowAndroid.cpp` also has a generic `CreateWindow(...)` function returning `nullptr`; only `CreateWindowAndroid(android_app*, ...)` creates the real Android window. That may be intentional platform dispatch, but the call graph needs to be traced before claiming the cross-platform window factory is complete.

### Build-status interpretation

The README claims all 20 C++ translation units pass `g++ -fsyntax-only -std=c++23` using API stubs and that the web app passes `next build` and ESLint. It explicitly says a full CMake build still requires third-party packages.

Therefore the verified status is:

**C++ syntax-level validation with stubs: claimed/present in project documentation.**

**Full native engine build: not yet independently proven by this research run.**

**Android APK CI configuration: present.**

**Successful Android CI run/artifact: not proven; the GitHub workflow-run lookup for the latest commit returned no run.**

## 10. Relationship between the three engine efforts

The repositories now show at least three distinct engine/runtime layers:

1. `dreammakerhub.website` — browser/server platform, engine adapters, Spatial/Gaussian-splat integration, WonderSpace orchestration and AI build/product layer.
2. `npc-ai-sim` — web-native Three.js/PlayCanvas-oriented NPC/3D builder with Gemini NPC analysis and simulated live-NPC transport.
3. `MOBILEAPP-VANGUARD-ENGINE` — native C++20/23 Vulkan/Jolt/ImGui engine/editor with Android Vulkan work and a Next.js Engine Architect Studio.

The separate older `vanguard-engine` repository contains an earlier C++ engine lineage with graphics/editor commits through August 16. It should be treated as a predecessor/parallel lineage until imports, copied code, or a migration relationship are proven.

**This is important:** we should not call all three repositories one single "custom UE5 engine" without tracing their actual dependency and code-sharing relationships. The evidence currently supports a **family of related engine efforts**, with DreamMakerHub acting as the broader platform layer.

## 11. Revised production-readiness assessment

### Stronger than previously documented

- Real OpenRouter AI transport in DreamMakerHub.
- Real paid/free model gating in `/api/chat`.
- Real usage logging and realtime usage-summary infrastructure.
- AI-PLAYGROUND is directly accessible and its workflow-template branch has been merged into `main`.
- WonderBuild has materially expanded its block library.
- A separate native C++/Vulkan Android engine repository exists and contains substantial real engine code.
- Android CI configuration exists for building a debug APK.

### Still not production-safe

- `/api/build/stream` still has a weaker authentication/usage-control boundary than `/api/chat`.
- Billing/entitlement tables and webhook targets remain split and require canonicalization.
- WonderPlay live-NPC transport remains simulated despite real Gemini analysis APIs.
- WonderPlay subscription endpoints remain in-memory.
- WonderPlay's WebSocket dependency/runtime path must be verified.
- Vanguard Android renderer contains concrete Vulkan shader and swapchain-extent defects.
- Full native C++/Android build success is not yet independently proven.
- Licensing/IP boundaries across the root MIT repo, WonderPlay, Vanguard and third-party dependencies still require an explicit inventory.

## 12. Next unresolved dependency queue

1. Trace `dreammakerhub.website` current Stripe webhook → canonical profile/subscription record → `/api/chat` plan check → `/api/build/stream` access and usage path.
2. Trace `AI-PLAYGROUND` server entrypoints from workflow canvas/agent spawn through provider registry to actual provider streaming and usage persistence on current `main`.
3. Trace WonderPlay `/live-npc` from browser/client to HTTP upgrade and determine whether the `ws` runtime is actually available in the Bun/Railway build.
4. Trace `MOBILEAPP-VANGUARD-ENGINE` Android Gradle target to native C++ entrypoint, then determine whether the Vulkan renderer is actually used by the APK target or is a separate minimal test renderer.
5. Trace code/import relationships between `vanguard-engine`, `MOBILEAPP-VANGUARD-ENGINE`, `npc-ai-sim`, and DreamMakerHub before making any unified-engine/IP claim.
6. Build a repository-wide license/SBOM map covering proprietary code, MIT-licensed code, PlayCanvas, Three.js, WebContainer, Gaussian splats, glTF Transform, Jolt, Vulkan/SDL/ImGui/Tracy/Filament and other third-party components.
