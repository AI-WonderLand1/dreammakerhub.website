# DreamMakerHub Master Technical & Commercial Research Report

_Last updated: 2026-08-20_

## Scope

Evidence-based running research record for DreamMakerHub / AI-WonderLand and connected repositories. Priority: `dreammakerhub.website`, `AI-PLAYGROUND`, and `wonderplay-3D`, with emphasis on engine customization, AI/NPC systems, WonderSpace/Coder/Kubernetes integration, pipelines, realtime infrastructure, mobile integration, security, licensing/IP, monetization, and production readiness.

## Executive status

**Overall:** the project contains substantially more real infrastructure than a simple marketing prototype, but it is a mixed-state codebase. Several important subsystems are implemented and connected, while other paths are architectural shells, duplicated implementations, placeholders, or stale/demo code. The strongest evidence is the combination of AI-PLAYGROUND's server/provider/realtime/billing foundation and DreamMakerHub's real Coder/Kubernetes workspace infrastructure. The weakest areas remain the custom engine renderer, pipeline execution bridge, parts of NPC runtime behavior, mobile backend integration, licensing documentation, and—newly confirmed—the coherence of the billing/entitlement data model.

**Important correction from prior runs:** Coder/Kubernetes/WonderSpace is **not merely unresolved**. `dreammakerhub.website` contains a real Coder client, authenticated workspace provisioning route, Coder/Kubernetes Terraform template, WonderSpace IDE launch UI, workspace persistence, and PlayCanvas 3D template. The branded `WonderSpaceIDE` and `PodLauncher` components both call the real `/api/user-workspace/provision` route. However, there are also parallel/stale workspace routes that only write local/Supabase records. The integration exists, but the Coder wrapper currently contains a serious readiness-polling identifier mismatch that must be fixed before it can be considered production-ready.

**Important correction about `wonderplay-3D`:** the repository is not only a Blender/Meshroom toolchain. Its current `package.json`, server, landing page, Gemini NPC APIs, and WebSocket code show a second/active direction as a **web-native AI NPC orchestration engine**. At the same time, its README still describes it as a 3D tools development environment. The repository is internally inconsistent/staged across two product directions and needs consolidation.

---

## Evidence reviewed — 2026-08-18

### 1. `dreammakerhub.website` — pipeline bridge and execution

#### `engine/core/pipelines.ts`

- A real `PipelineToEngineCompiler` imports `GraphExecutor`, `EngineConfig`, `ExecutionGraph`, `ExecutionNode`, `NodeType`, and Supabase types.
- It reads pipeline metadata and converts pipeline nodes into an execution graph and then an engine configuration.
- It defines runtime metadata for streaming, scheduled execution, subscription level, and Supabase pipeline channels.
- It defines generated Supabase Edge Function source for `executePipeline`, `evaluateExpression`, and `savePipeline`.
- It registers runners for `ai.generate`, `asset.stream`, and `custom`.
- **Critical implementation gap:** `getAIResponse()` returns a placeholder string (`AI response to: ...`) rather than calling AI-PLAYGROUND's provider system.
- **Critical implementation gap:** `evaluateExpression()` returns the expression string rather than evaluating it.
- **Security naming problem:** `encodePipelineConfig()` and `encodeNodeConfig()` only Base64-encode JSON. Base64 is not encryption.
- Node mapping exists, but several mappings are placeholders/semantically weak: `trigger`, `if`, `split`, `merge`, `git` are mapped to `engine.render`.

#### `engine/core/execution/executor.ts`

- A real topological-sort/runner architecture exists.
- Runners are registered by node type and execution status is tracked.
- **Critical compile/type issue:** the executor calls `graph.getAllNodes()`, but `ExecutionGraph` exposes `nodes` and no `getAllNodes()` method.
- **Critical runtime gap:** `resolveInputs()` returns `node.inputs`; dependency-output mapping is not implemented.
- Therefore the graph executor is a real execution framework but not yet a complete dataflow engine.

#### `engine/core/pipeline-runner.ts`

- Real Supabase-backed pipeline loading and compilation exists.
- `loadPipelineFromTemplate()` reads `pipeline_templates` and compiles through `PipelineToEngineCompiler`.
- `compilePipelineToEngine()` checks subscription tier and organization/user/public access, records compilation results, increments usage, and returns metadata.
- `saveCompiledEngine()` persists compiled engines, grants pipeline access, and broadcasts `engine:compiled` through Supabase.
- **Security concern:** the server-only Supabase client uses `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY`; silently falling back to an anon key is unsafe for privileged operations.
- **Integration conclusion:** pipeline storage/compilation is real, but the actual AI execution path is not end-to-end.

### 2. `dreammakerhub.website` — Coder / Kubernetes / WonderSpace

#### `infra/coder/template/main.tf`

- Real Terraform using Coder and Kubernetes providers.
- Defines CPU, memory, disk, TTL/autostop parameters.
- Creates Coder agent, code-server app, persistent volume claim, and Kubernetes deployment.
- Runs code-server bound to localhost behind Coder proxy.
- Creates SSH key and starts SSH.
- Runs workspace containers as non-root UID 1000.

#### `packages/coder-workspace/src/coder-client.js`

- Real Coder REST client using `Coder-Session-Token`.
- Implements workspace listing, creation, lifecycle, build operations/logs, readiness polling, file upload, template listing, AI bridge inspection, provider CRUD, and agent inspection.
- File upload rejects path traversal/invalid paths.

#### `apps/web/components/engines/WonderSpaceIDE.tsx`

- Authenticated UI directly calls `/api/user-workspace/provision` and redirects to the returned IDE URL.
- This is a genuine public-facing path into the Coder infrastructure.

#### `apps/web/components/engines/PodLauncher.tsx`

- Authenticated launcher supports `ide` and `playcanvas` pods and sends requested CPU/memory values to `/api/user-workspace/provision`.
- Displays returned workspace URL and SSH command.

#### `apps/web/app/api/user-workspace/provision/route.ts`

- Authenticates through Supabase.
- Maps `ide` → `wonderspace-ide` and `playcanvas` → `playcanvas-3d`.
- Validates pod names and pod type.
- Obtains a per-user SSH key.
- Calls `CoderAPIWrapper.createWorkspaceForApp()` with Coder credentials.
- Returns workspace/IDE URL and SSH command.

#### `apps/web/lib/coder/api-wrapper.ts`

- Builds Coder requests with CPU, memory, disk, SSH key, environment, AI tools and PlayCanvas parameters.
- Uses a 4-hour TTL for `createWorkspaceForApp()`.
- Persists workspace metadata in Supabase.
- **New critical blocker:** `createWorkspace()` generates a local `crypto.randomUUID()` as `workspaceId`, then stores it as the local workspace ID and passes that local UUID to `waitForWorkspaceReady()`. The Coder API response separately contains the real Coder workspace ID. `waitForWorkspaceReady()` calls `getWorkspace()` using the local UUID, so the readiness poll appears to query the wrong identifier. This can cause a real Coder workspace to be created while the wrapper waits until timeout. This must be fixed by using the Coder-returned workspace ID for Coder API polling and keeping any local UUID separate.
- **Identity dependency:** the route passes the Supabase user UUID into Coder's `/api/v2/users/{userId}/workspaces`. A verified mapping between Supabase user IDs and Coder user IDs was not established; this must be confirmed in the deployed Coder instance.

#### `apps/web/app/wonderspace/ide/page.tsx` + `apps/web/app/api/wonderspace/projects/route.ts`

- Separate branded UI can POST to `/api/wonderspace/projects`.
- That route stores projects in `data/wonderspace-projects.json` and does not provision Coder.
- The platform selector (`web`, `ios`, `android`, `multi`) is metadata only on this route.

#### `apps/web/app/api/workspace/provision/route.ts`

- Another workspace route only creates a Supabase `workspaces` record with `status: READY` and does not call Coder.

**Coder/WonderSpace conclusion:** the real Coder path is verified in source and exposed by actual UI components, but the wrapper has a readiness identifier bug and the repository still contains duplicate fake/local workspace paths. Consolidation and identifier repair are required before public cloud workspace launch.

### 3. `AI-PLAYGROUND` — workflow/agent architecture

#### `src/data/workflowTemplates.ts`

- Contains real workflow templates with trigger, HTTP, code, AI-agent, IF, split, merge, loop, and schedule nodes.
- Templates reference actual model IDs and define prompts/node configurations.
- Templates do not by themselves prove every node type executes correctly.

#### `src/components/AgentCompiler.tsx`

- UI exposes model selection, system prompt, web search, code execution, vision, memory, training sources, and a `Compile & Spawn Agent` action.
- The component delegates execution to `onSpawnAgent`; the actual handler requires tracing from its parent.

#### `src/components/AIWonderCanvas.tsx`

- Contains the actual workflow canvas, agent-creation state, node execution state, telemetry, workflow versioning, credentials, variables, memory, and integrations.
- Credentials and variables are persisted in browser `localStorage` in this component. This is convenient for a local workspace but is **not a secure production credential vault**.
- Imports `GoogleGenAI` directly and contains local execution utilities, meaning AI-PLAYGROUND mixes browser-side execution/tooling with its server-side provider proxy.
- This creates a boundary that must be audited before claiming that all model calls and secrets are server-isolated.

### 4. `AI-PLAYGROUND` — model provider layer

#### `server/providers/registry.ts`

- Real provider configurations exist for OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together, Fireworks, DeepSeek, Perplexity, xAI, and Google Gemini.
- Server-side environment variables hold provider keys.
- Many model IDs route through OpenRouter.
- Replicate and Hugging Face remain stubs with empty request builders/placeholder responses.
- Anthropic requests include `anthropic-dangerous-direct-browser-access` even though requests are server-side; review/remove this header.

### 5. `AI-PLAYGROUND` — realtime and billing

- `useRealtimeSync.ts` implements authenticated Supabase realtime for agents, workflows and memories.
- Supabase schema contains Auth-linked profiles, agents, usage logs, subscriptions, memories and workflows with RLS.
- `usage_logs` includes model, token counts, cost, duration and status.
- `subscriptions` stores Stripe customer/subscription IDs, plan, status, billing periods and cancellation state.
- Stripe webhook code verifies signatures and handles checkout completion, subscription updates/deletion, and successful invoices.
- Global CORS remains permissive and should be restricted for production.

### 6. `wonderplay-3D` — corrected repository assessment

#### `package.json`

- Current package name is `custom-npc-orchestration-engine`.
- Build script is `vite build && tsc --project tsconfig.json`.
- Dependencies include glTF Transform, Google GenAI SDK, React, Three.js and Express.

#### `server.ts`

- Real Gemini-backed NPC intelligence, image/vision, and video-analysis endpoints exist.
- Contact endpoint only logs submissions; it does not durably store/send them.
- Subscription endpoints are in-memory only and reset on restart.
- WebSocket `/live-npc` exists but currently simulates thinking/responding and emits randomized viseme values.
- **Security concern:** Gemini endpoints accept an API key from request bodies. Production should not accept privileged provider keys from arbitrary browser clients.
- 50 MB JSON payload limit is configured; rate limiting/abuse protection was not established.

#### `src/components/LandingPage.tsx`

- Marketing page claims intelligent reasoning, visual perception, behavior control, web-native Three.js, and “sub-100ms latency.”
- The latency claim is not substantiated by measured telemetry in inspected code.

#### `README.md` / toolchain

- README still describes Blender/Meshroom/COLMAP development tooling and a ~14 GB Meshroom download.
- Current package/server describe an AI NPC product direction.
- Repository scope and documentation need consolidation.

### 7. New 2026-08-19 finding — mobile integration

#### `apps/mobile/package.json`

- This is a real Expo/React Native app named `wonderspace-mobile`.
- Scripts include `expo start`, `expo run:android`, `expo run:ios`, web start, and TypeScript checking.
- Dependencies include Expo 54, React Native 0.81.4, Expo Router 6, React 19.1, and navigation libraries.

#### `apps/mobile/app.json`

- Defines iOS bundle identifier `com.aiwonderland.wonderspace`.
- Defines Android package `com.aiwonderland.wonderspace`.
- Expo Router is configured and an EAS project ID is present.

#### `apps/mobile/eas.json`

- EAS profiles exist for preview APK builds and production Android/iOS builds.
- **This is stronger than the previous “mobile unverified” classification:** a real native packaging configuration exists.
- It still does **not** prove a successful published build, store submission, or end-to-end backend integration.

#### `apps/mobile/app/builder.tsx` + `apps/mobile/lib/api.ts`

- Mobile Builder UI is real and calls `createBuild()`.
- If `EXPO_PUBLIC_API_BASE_URL` is absent, `createBuild()` intentionally returns a demo result (`demo-${Date.now()}`) after a 700 ms delay.
- If configured, it POSTs to `${API_BASE_URL}/build`.
- The Builder UI itself says: “The demo mode is already functional; later we'll connect the real AI backend.”
- **Conclusion:** native mobile shell and EAS packaging are implemented; the core mobile AI build workflow is still scaffold/demo unless a real `/build` backend is supplied and verified.

#### `apps/mobile/app/marketplace.tsx`

- Marketplace screen currently renders three hard-coded extension cards.
- No install/purchase/backend marketplace flow is implemented in this file.

### 8. New 2026-08-19 finding — commercial checkout path

#### `apps/web/lib/billing/plans.ts`

- Four plan definitions exist: free `nomad`, paid `architect` ($39/mo; $390/yr), paid `guild` ($129/mo; $1,290/yr), and custom enterprise.
- Paid plans have environment-driven Stripe monthly/yearly price IDs.
- Plans also define runtime hours, AI tokens, API calls, storage, seats, compute credits and other entitlements.

#### `apps/web/app/api/subscription/subscribe/route.ts`

- A genuine server-side Stripe Checkout Session creator exists.
- It authenticates the Supabase bearer token, validates plan and interval, resolves the configured Stripe Price ID, creates a subscription-mode Checkout Session, includes `userId`, `plan`, and `interval` metadata, and returns `session.url`.
- This is a real production-oriented checkout implementation.

#### `apps/web/app/checkout/page.tsx` and `apps/web/app/subscription/page.tsx`

- **Critical commercial routing mismatch:** the public checkout/subscription UI currently hard-codes a single Stripe Payment Link for both paid plans instead of calling `/api/subscription/subscribe` and using the plan-specific Stripe Price ID.
- Therefore the repository contains a real dynamic Stripe checkout backend, but the main subscription UI appears to bypass it.
- The annual/monthly toggle also contains a logic bug: it checks `billingInterval === 'monthly'` even though the state values are `month` and `year`, so toggling from annual back to monthly is not correctly implemented.
- This is a major pre-launch billing blocker because a user selecting Architect vs Guild or monthly vs annual may be sent to the same hard-coded Payment Link.

#### `apps/web/app/(workspace)/dashboard/subscription/page.tsx`

- Dashboard billing management calls real portal/cancel routes.
- Current plan is derived from `user.user_metadata.plan` in the UI; webhook/database entitlement synchronization must be checked to ensure this metadata is authoritative.

### 9. New 2026-08-19 finding — standalone Agent API security

#### `agent/api/main.py`

- Real FastAPI service exposes Alice, Spirit Guide and Orchestrator endpoints.
- Uses Gemini/Groq/OpenRouter environment keys and an API-key manager.
- **Critical security issue:** CORS is `allow_origins=["*"]` with credentials allowed.

---

## Evidence reviewed — 2026-08-20

### 10. Commercial entitlement model is internally split across incompatible data paths

#### `apps/web/lib/billing/plans.ts`

- The code-level plan IDs are actually `free`, `pro`, `team`, and `enterprise`.
- The customer-facing names are `The Nomad`, `The Architect`, `The Guild`, and `The Architect of Worlds`.
- This is not itself a problem, but downstream code must consistently use the IDs rather than assuming the display names are identifiers.

#### `supabase/migrations/009_create_profiles_and_projects.sql`

- The repository's explicit migration creates `user_profiles`, not `profiles`.
- `user_profiles` contains `subscription_plan`, limits, usage counters and timestamps.
- Its RLS policy allows an authenticated user to **UPDATE their own entire `user_profiles` row**. There is no column-level restriction in the migration preventing a user from changing `subscription_plan` or the limit columns. This is a serious entitlement-escalation risk if the deployed schema matches the migration.
- The migration creates `usage_logs`, `projects`, `support_tickets`, and `client_error_logs`, with owner-scoped RLS.

#### `apps/web/app/api/subscription/ensure/route.ts`

- The free-plan route writes to a table named `profiles`, not `user_profiles`.
- The route itself admits that it assumes a `profiles` table with `id` and `plan`, and returns an error if it does not exist.

#### `apps/web/app/api/webhooks/stripe/route.ts`

- Stripe webhook signature verification is correctly enforced when the secret/signature are present.
- But the webhook writes checkout state into `profiles` and `subscriptions`.
- The indexed repository migration reviewed here creates `user_profiles`, and no matching `profiles`/`subscriptions` migration was found by code search for the fields used by the webhook.
- `customer.subscription.deleted` also updates `profiles.plan` to null.
- **Commercial blocker:** the Stripe checkout session creation is real, but entitlement persistence is not demonstrated as wired to the same canonical tables used by limits/auth. This must be reconciled before taking real customer payments.

#### `apps/web/app/api/subscription/cancel/route.ts`

- This route expects `stripe_customer_id` and `stripe_subscription_id` columns on `user_profiles` and updates `subscription_plan` there.
- Those Stripe columns are not present in migration `009_create_profiles_and_projects.sql`, and no separate migration defining them was found in the indexed repository search.
- This is another concrete sign that billing data models have diverged.

### 11. Plan enforcement has a confirmed schema/type defect and a race condition

#### `apps/web/lib/billing/limits.ts`

- `UserLimits` defines `projectsLimit` and usage counters, but **does not define `projectsUsed`**.
- `checkProjectLimit()` nevertheless references `limits.projectsUsed` in the `projectsLimit` branch. This is a TypeScript/data-model mismatch and should be repaired rather than relying on a nonexistent property.
- `checkAndConsumeAITokens()` performs read → check → insert usage log → update profile as separate operations. Two concurrent requests can both observe the same remaining balance and oversubscribe the monthly token allowance. Consumption should be made atomic at the database layer.
- The same file defines `PLAN_PERMISSIONS`, so feature gating is centralized in code, but actual enforcement must still be traced at every privileged API boundary.

### 12. The public AI build endpoint is real, but its commercial/security gate is currently weak

#### `apps/web/app/api/build/stream/route.ts`

- This is a genuine multi-stage AI build pipeline: Architect → Builder → Reviewer → optional Runner.
- It calls the real `runModel()` provider router, generates code, reviews it with a second model call, and can persist output through `manifestVisualBlock()`.
- The route allows anonymous requests; anonymous users are treated as Free users.
- A single build can make **three model calls** (planning, generation, review) before any save operation.
- No per-request rate limiting or usage-metering call is present in this route.
- `save` writes generated output into the application's blocks directory.
- This is strong evidence of an actual working AI-build workflow, but it is also a direct cost-abuse surface until authentication/rate limits/usage accounting are enforced.

#### `apps/web/lib/auth.ts`

- `getAuthUser()` determines `isPaid` solely from `data.user.app_metadata?.plan === 'pro'`.
- Therefore the `team` plan is not recognized as paid by this helper.
- More importantly, the Stripe webhook inspected today writes to `profiles`/`subscriptions`, not Supabase Auth `app_metadata`, and no `auth.admin.updateUserById` implementation was found in the repository search.
- **Conclusion:** the build route's paid/free decision is not demonstrably connected to successful Stripe checkout. A user can pay through one subsystem while the build route still treats them as free.

### 13. Mobile build contract is not connected to the web AI build route

#### `apps/mobile/lib/api.ts`

- The mobile client expects a JSON `POST ${API_BASE_URL}/build` returning `{id,title,summary,status}`.
- If no API base URL is configured it intentionally returns a demo response locally.

#### `apps/web/app/api/build/stream/route.ts`

- The available web build endpoint is `/api/build/stream` and returns Server-Sent Events, not the mobile JSON contract.
- A repository search did not find a matching `/build` JSON route for the mobile client.
- **Conclusion:** mobile packaging is real, but the production mobile build path is currently a contract gap, not merely an environment-variable problem.

### 14. WonderSpace has two real execution architectures: WebContainer and Coder/Kubernetes

#### `packages/ide-engine/package.json` / `src/WebContainerManager.ts`

- `@wonderspace/ide-engine` is a real local workspace package inside the monorepo, not an external mystery dependency.
- It uses `@webcontainer/api` and provides boot, mount, read/write/delete, directory creation, process spawning, server-ready events, file watching, and teardown.
- The package is therefore a genuine **browser-local IDE runtime**.

#### `packages/ide-engine/src/WebContainerPersistence.ts`

- Project snapshots are serialized and uploaded to Supabase Storage under a per-user path.
- Snapshot save is debounced by three seconds.
- This provides a real local-IDE persistence mechanism independent of Coder.

#### Root `package.json`

- The workspace depends on `@wonderspace/ide-engine: "*"`, while the local package declares the same name and is included by the `packages/*` workspace glob.
- This resolves the previously unresolved dependency: it is a local workspace package.

**Architecture conclusion:** WonderSpace is not one IDE implementation. The codebase contains a browser-local WebContainer IDE and a cloud Coder/Kubernetes IDE. This can be a useful dual-mode product strategy, but the UX and project model need an explicit boundary so users know whether they are editing locally in-browser or provisioning a cloud workspace.

### 15. BYOC is currently UI persistence, not a verified cloud connection

#### `apps/web/lib/byocSdk.ts`

- BYOC validates provider, region, account/project ID and role ARN fields.
- It then stores the resulting environment object in browser `localStorage` under `wonder:byoc:environments` and marks it `status: "connected"`.
- The function instantiates a Colyseus client if configured, but does not use that client to validate AWS/GCP/Azure credentials or create infrastructure.
- No server-side BYOC provisioning call was found in this SDK.
- **Conclusion:** the BYOC settings flow is a configuration UI with local persistence, not evidence of a completed AWS/GCP/Azure connection or provisioning system.

### 16. The DreamMakerHub Spatial Engine is a real custom adapter around a third-party Gaussian-splat renderer

#### `engine/core/adapters/spatial/adapter.ts`

- `SpatialAdapter` is implemented and registered by the engine core.
- It loads a `SpatialWorld`, selects Gaussian Splatting by default, and falls back to Three.js if splat assets/runtime are unavailable.
- It owns renderer lifecycle and exposes the engine adapter contract.

#### `engine/core/adapters/spatial/splatRenderer.ts`

- Uses the real `@mkkellogg/gaussian-splats-3d` dependency via dynamic import.
- Creates a viewer, loads splat scenes from the platform asset manager, applies position/rotation/scale metadata, starts progressive loading, and hooks frame callbacks.
- The root `package.json` explicitly includes `@mkkellogg/gaussian-splats-3d`.

**IP/technical conclusion:** the Spatial Engine's world model, asset loading, adapter lifecycle, fallback strategy, and integration into EngineManager are custom DreamMakerHub code; the underlying Gaussian-splat rendering implementation is a third-party library. Public claims should describe this accurately rather than implying the low-level splat renderer itself was written from scratch.

### 17. Client/server boundary problem in the engine manager

#### `engine/core/runtime/engine-manager.ts` + `engine/core/index.ts` + `apps/web/components/QuadEngineShell.tsx`

- `QuadEngineShell.tsx` is explicitly a `'use client'` component and imports `engineManager` and `registerAllAdapters` from `@engine/core`.
- `engine-manager.ts` initializes Supabase using `SUPABASE_SERVICE_ROLE_KEY` and performs privileged writes/listeners against pipeline tables and engine events.
- The same manager also uses browser-only APIs such as `document`, `requestAnimationFrame`, WebGL contexts and device destruction.
- This is a **server/client responsibility violation**. Next.js will not expose non-public environment variables to the browser bundle, so the current arrangement is more likely to fail or behave inconsistently than to safely provide a client-side service-role connection. Either way, privileged Supabase operations should be moved behind server-side APIs, with the browser subscribing through a safe channel.

### 18. AI code-generation security is implemented but remains shallow

#### `engine/core/security/Sanitizer.ts`

- A central `SecurityCore.validateCodeSafety()` exists and checks prompts/code against a substring blacklist for patterns such as `eval`, `exec`, `child_process`, `process.env`, `document.cookie`, `localStorage`, dynamic import, and filesystem access.
- This is evidence of an explicit security layer, but substring blacklists are not a sufficient sandbox for arbitrary AI-generated code. They can produce false positives and do not constitute a complete AST/runtime policy.

#### `apps/web/app/api/agent/route.ts`

- The route validates agent type and command category with Zod and a whitelist, calls the real `runModel()` router, parses JSON output, performs another dangerous-pattern scan, and writes generated React blocks.
- The route itself does **not authenticate the caller or meter model usage** before invoking the paid OpenRouter model.
- Because the route can trigger an external model and write files, it is a high-priority abuse/cost-control endpoint.

#### `engine/core/ai/bridge.ts`

- `manifestVisualBlock()` performs the safety scan and writes AI-generated code into `apps/web/app/(builder)/blocks`.
- The current agent route supplies a generated safe filename, so the inspected public path is not directly path-traversable through that route. The bridge itself does not independently canonicalize/restrict `fileName`, so any future caller must do so.

### 19. Real provider routing is implemented in the engine layer

#### `engine/core/ai/runModel.ts` + `engine/core/ai/providers/openrouter.ts`

- `runModel()` has a concrete registry for GitHub, Groq, Google, OpenRouter, OpenCode, n8n, Cerebras, OpenAI, Anthropic, custom API, webhook and DreamMakerHub providers.
- OpenRouter is a real server-side implementation using `OPENROUTER_API_KEY` when no per-user key is supplied.
- The provider performs a real POST to OpenRouter's chat-completions endpoint and returns model output/error metadata.
- This establishes that the website's build and agent routes can reach real model providers; the remaining problem is entitlement, abuse control, and pipeline integration—not absence of an AI transport layer.

### 20. Root licensing/IP signal changed the prior assessment

#### Root `LICENSE`

- The repository **does have a root MIT License**, with copyright text naming `Custom Engine Team`.
- This corrects the prior conclusion that the repository had no license file.
- However, because the license is at repository root and broadly grants rights to deal in the “Software,” the exact intended scope of that MIT grant needs legal clarification before commercial/IP claims are made about the whole monorepo.
- A dependency/license inventory is still required for third-party components such as PlayCanvas, Three.js, WebContainer, Gaussian Splatting, glTF Transform, Coder, Kubernetes libraries and any bundled WebGL Studio assets.
- This is now a **high-priority IP/legal clarification**, especially if the business intends to keep proprietary platform code closed while distributing or commercializing selected components.

---

## Current blocker queue — evidence-driven

### P0 — Do not take live customer money through the current public checkout until reconciled

1. Canonicalize billing tables: `user_profiles` vs `profiles` vs `subscriptions`.
2. Ensure Stripe webhook state updates the same canonical entitlement record consumed by auth and limits.
3. Add missing Stripe identifiers to the canonical schema through a migration if they are actually required.
4. Replace the hard-coded public Stripe Payment Link with the authenticated dynamic checkout endpoint.
5. Fix the annual/monthly toggle.
6. Make entitlement changes server-controlled; remove client ability to edit subscription/limit columns.

### P0 — Protect AI/cloud spend

1. Require authentication or a tightly rate-limited anonymous quota for `/api/build/stream` and `/api/agent`.
2. Meter every model call and enforce plan limits before provider invocation.
3. Make token/compute consumption atomic.
4. Add per-IP/user/org rate limits and maximum concurrent builds.
5. Move privileged engine/Supabase operations behind server APIs.

### P1 — Make WonderSpace production coherent

1. Fix Coder workspace polling to use the Coder-returned workspace ID.
2. Verify Supabase-user ↔ Coder-user identity mapping in the deployed Coder instance.
3. Decide how WebContainer-local IDE and Coder-cloud IDE coexist and unify project persistence.
4. Remove or clearly mark duplicate local/Supabase-only workspace provisioning paths.
5. Replace BYOC “connected” localStorage state with real server-side credential/identity validation.

### P1 — Complete the execution chain

1. Fix `GraphExecutor` interface mismatch.
2. Implement dependency-output resolution.
3. Replace pipeline `getAIResponse()` with `runModel()` or a dedicated provider service.
4. Implement a safe expression evaluator rather than returning the expression string.
5. Replace Base64 “encryption” with authenticated encryption or remove the misleading name.
6. Implement correct node-type semantics instead of mapping control-flow nodes to `engine.render`.

### P1 — Mobile

1. Add/verify a real mobile `/build` JSON API or change mobile to consume the existing SSE `/api/build/stream` protocol.
2. Add authentication and plan/usage enforcement to mobile builds.
3. Replace the demo builder path before public-store launch.
4. Replace hard-coded marketplace cards with real backend data and transaction flow.

### P1 — Security/IP

1. Replace substring blacklists with layered validation/sandboxing for AI-generated code.
2. Audit browser-side credential storage in AI-PLAYGROUND.
3. Restrict CORS to known origins.
4. Remove privileged API-key acceptance from browser-facing NPC endpoints.
5. Clarify root MIT license scope and produce a dependency/SBOM/license inventory.
6. Consolidate WonderPlay documentation and clearly label third-party rendering dependencies.

---

## Current positive evidence

Despite the blocker queue, the repository contains substantial implemented value:

- Real multi-provider AI transport and model routing.
- A real multi-stage AI build pipeline (architect → builder → reviewer → runner).
- Real Supabase realtime patterns and persistence.
- Real Coder/Kubernetes workspace provisioning infrastructure.
- A real browser-local WebContainer IDE package with persistence.
- Real engine adapter architecture with PlayCanvas, WebGL, Three.js and a DreamMakerHub Spatial adapter.
- Real Gaussian-splat integration through a third-party renderer.
- Real mobile Expo/EAS packaging.
- Real Stripe Checkout Session creation and webhook signature verification.
- Real plan/usage/permission data structures.
- Real AI-generated code manifestation into the builder workspace.

The strategic picture is therefore **not “fake project vs finished product.”** It is a substantial early-stage platform whose strongest components are real but whose commercial control plane, execution bridge, security boundaries, and cross-repository contracts have not yet been consolidated into one production-safe path.

## Next investigation target

The next pass should trace the canonical user journey end-to-end after authentication:

**signup → canonical profile/plan → Stripe checkout → webhook entitlement → `/api/build/stream` → usage accounting → AI provider → generated artifact → project persistence → WonderSpace WebContainer/Coder workspace → realtime event → mobile/API parity.**

At each transition, verify the actual database table, route, import, response shape, and authorization boundary. Any unresolved dependency should become the next targeted investigation rather than being inferred from UI or documentation.