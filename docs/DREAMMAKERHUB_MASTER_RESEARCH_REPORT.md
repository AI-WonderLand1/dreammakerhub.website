# DreamMakerHub Master Technical & Commercial Research Report

_Last updated: 2026-08-19_

## Scope

Evidence-based running research record for DreamMakerHub / AI-WonderLand and connected repositories. Priority: `dreammakerhub.website`, `AI-PLAYGROUND`, and `wonderplay-3D`, with emphasis on engine customization, AI/NPC systems, WonderSpace/Coder/Kubernetes integration, pipelines, realtime infrastructure, mobile integration, security, licensing/IP, monetization, and production readiness.

## Executive status

**Overall:** the project contains substantially more real infrastructure than a simple marketing prototype, but it is a mixed-state codebase. Several important subsystems are implemented and connected, while other paths are architectural shells, duplicated implementations, placeholders, or stale/demo code. The strongest evidence is the combination of AI-PLAYGROUND's server/provider/realtime/billing foundation and DreamMakerHub's real Coder/Kubernetes workspace infrastructure. The weakest areas remain the custom engine renderer, pipeline execution bridge, parts of NPC runtime behavior, mobile backend integration, and licensing documentation.

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
- **Critical security issue:** `/api/keys/create` has no authentication dependency and can create API keys for arbitrary owners.
- This service is therefore a real agent backend but not safe for unrestricted public exposure in its current form.

#### `agent/core/alice.py`

- Alice is a real Gemini-backed agent with repository analysis, memory bank and Neurolink integration.
- `ask()` calls Gemini `gemini-2.0-flash` and stores extracted concepts into memory.
- This is a genuine model-backed agent, not merely UI scaffolding.

#### `agent/core/api_keys.py`

- API keys are hashed with PBKDF2-HMAC-SHA256 using a pepper and stored in SQLite.
- **Critical bug:** the pepper defaults to the literal `change-me-in-production` if not configured.
- **Critical bug:** key creation uses PBKDF2-derived hashes, but `revoke_key()` and usage logging derive a plain SHA-256 hash instead. Revocation/logging therefore cannot reliably match keys created by the manager.
- Rate-limit fields exist in storage, but enforcement was not established in the inspected request dependency.

---

## Cross-repository architecture findings

### Strong / implemented foundations

1. AI-PLAYGROUND server-side provider proxy and broad model registry.
2. AI-PLAYGROUND authenticated Supabase persistence and realtime synchronization.
3. AI-PLAYGROUND subscription schema and Stripe webhook foundation.
4. DreamMakerHub custom engine plugin/event/scene runtime skeleton.
5. DreamMakerHub pipeline compiler, pipeline persistence, graph executor framework, and subscription-aware access logic.
6. Real Coder API client and Coder/Kubernetes workspace infrastructure.
7. Real user-authenticated DreamMakerHub → Coder workspace provisioning path in UI and API.
8. WonderPlay-3D Gemini NPC intelligence/vision/video endpoints.
9. DreamMakerHub native mobile Expo app shell plus EAS Android/iOS build configuration.
10. DreamMakerHub dynamic Stripe Checkout Session backend.
11. Standalone Alice/Gemini agent backend with memory/repository-analysis components.

### Partially implemented / scaffolded

1. Custom-engine rendering: WebGL clear loop; no real geometry renderer in core.
2. External AI in custom-engine: placeholder response.
3. Pipeline AI runner: placeholder response instead of AI-PLAYGROUND provider integration.
4. Pipeline expression evaluation: placeholder.
5. Graph executor dependency-input resolution: not implemented.
6. Replicate/Hugging Face provider adapters: stubs.
7. WonderSpace duplicate filesystem-only project path.
8. Separate Supabase-only workspace route.
9. Coder wrapper readiness polling: likely broken by local-vs-Coder workspace ID mismatch.
10. Mobile Builder backend: explicit demo fallback unless `EXPO_PUBLIC_API_BASE_URL` is configured.
11. Mobile Marketplace: hard-coded display data, no verified install/purchase path.
12. WonderPlay WebSocket visemes: randomized simulation.
13. WonderPlay subscriptions: in-memory demo state.
14. Public subscription UI: hard-coded Stripe Payment Link rather than dynamic plan-specific checkout route.
15. Annual/monthly toggle logic: incorrect state comparison.
16. Agent API key creation/revocation: security/consistency defects.

### Resolved integration boundary: Coder/Kubernetes/WonderSpace

The real path is:

`WonderSpaceIDE / PodLauncher` → `/api/user-workspace/provision` → `CoderAPIWrapper.createWorkspaceForApp()` → Coder `/api/v2` → Kubernetes workspace/template → code-server/WonderSpace environment.

A separate non-Coder path remains:

`WonderSpace IDE launch page` → `/api/wonderspace/projects` → local `data/wonderspace-projects.json` → `/ide`.

The real path is implemented in source, but the readiness polling identifier mismatch is now a priority blocker.

---

## Security findings

### Positive

- AI-PLAYGROUND provider keys are server-side environment variables.
- Supabase RLS exists on core user data.
- Stripe signature verification exists.
- Coder client uses server-side credentials.
- Coder file upload contains path traversal/invalid-path checks.
- User-workspace route authenticates the Supabase user before provisioning.
- Kubernetes workspace template runs as non-root UID 1000.
- Agent API keys are intended to be stored as PBKDF2-derived hashes.

### Concerns

- AI-PLAYGROUND global CORS is permissive.
- AI-PLAYGROUND browser-side localStorage stores credentials/variables in `AIWonderCanvas`.
- `nodeExec.ts` accepts API keys through node configuration; exposure/persistence must be audited.
- WonderPlay accepts Gemini API keys from request bodies.
- WonderPlay allows very large JSON payloads without evidence of production rate limiting.
- `pipeline-runner.ts` falls back from service-role Supabase key to anon key.
- Base64 is labeled as encryption in pipeline code.
- Multiple workspace endpoints can report “provisioned/ready” without actually provisioning Coder.
- Coder readiness polling appears to use a locally generated UUID instead of the Coder workspace ID.
- Workspace image/owner/platform inputs need authorization and quota controls before public provisioning.
- Code-server is launched with `--auth none` but bound to localhost and intended to sit behind Coder; deployment must preserve that network boundary.
- SSH key lifecycle/revocation needs formal review.
- Agent API CORS is wildcard with credentials.
- Agent API `/api/keys/create` lacks authentication.
- Agent API pepper defaults to `change-me-in-production`.
- Agent API revoke/logging hashes are inconsistent with key creation hashing.

---

## Monetization readiness

### Strong commercial primitives

- Stripe customer/subscription IDs.
- Subscription plans and lifecycle state.
- Token/cost usage logging.
- Realtime usage/state synchronization.
- Pipeline subscription gating.
- Workspace CPU/memory/disk parameters and TTLs.
- Coder infrastructure capable of provisioning compute-backed workspaces.
- Dynamic Stripe Checkout Session backend with plan-specific price IDs.
- Dashboard portal/cancel routes.

### Best near-term commercial architecture

A hybrid model remains supported by the evidence:

**Subscription = capability/access**

**Usage = expensive compute/AI/build consumption**

Potential metered resources include AI inference, cloud workspace hours, builds, storage and high-cost generation.

### Immediate commercial blockers

1. Make the public subscription UI call `/api/subscription/subscribe` instead of the hard-coded Payment Link.
2. Verify Stripe webhook URL composition and entitlement synchronization.
3. Fix annual/monthly billing toggle state logic.
4. Ensure plan-specific Stripe Price IDs exist for Architect and Guild monthly/yearly.
5. Ensure real billing state cannot be confused with WonderPlay's in-memory subscription demo.
6. Define Coder workspace quotas and cost controls before offering cloud workspaces broadly.
7. Consolidate fake/local workspace routes so public users cannot receive a false “ready” state.

### Sponsorship

The founding sponsorship program should remain separate from product subscriptions. Sponsorship is project support and promotional/technology partnership, not an investment or promise of financial return.

---

## Licensing / IP status

- `custom-engine/package.json` declares MIT, but repository-level `custom-engine/LICENSE` was not found in the inspected tree. Treat the declared license as unverified until a license file/root policy is confirmed.
- `wonderplay-3D` has no repository `LICENSE` found in the inspected root.
- WonderPlay references/downloads Blender, COLMAP and Meshroom tooling; exact upstream licenses and redistribution obligations must be inventoried.
- WonderPlay dependencies include Three.js, glTF Transform, Google GenAI and Express; dependency licenses must be captured in a commercial bill of materials.
- Any statement that DreamMakerHub is a “custom Unreal Engine 5” should be avoided until upstream source/license provenance is established. Evidence reviewed here supports a custom WebGL runtime plus Three.js-based tooling, not an Unreal-derived engine.
- No evidence establishes exclusive rights to every upstream asset, model, binary, provider route, or downloaded tool.

---

## Mobile integration status

- A real Expo/React Native app exists under `apps/mobile`.
- iOS and Android identifiers are configured.
- EAS preview/production profiles are present, including Android APK preview and production Android/iOS profiles.
- **Native packaging configuration: implemented.**
- **Native build/publish result: unverified.**
- Mobile Builder explicitly falls back to demo results when `EXPO_PUBLIC_API_BASE_URL` is absent.
- Mobile Marketplace is currently static display data.
- **Status: native shell/build configuration implemented; production backend integration and store readiness unverified.**

---

## Production-readiness scorecard

| Area | Status | Evidence |
|---|---|---|
| AI provider proxy | Partially production-oriented | Real provider proxy; some provider stubs |
| AI-PLAYGROUND realtime | Implemented foundation | Supabase realtime + authenticated filtering |
| Subscription persistence | Implemented foundation | Stripe IDs/status in Supabase |
| Stripe webhook | Implemented but route must be verified | Signature verification + lifecycle handlers |
| Public Stripe checkout | Partial/blocker | Dynamic server route exists; UI hard-codes one Payment Link |
| Pipeline compiler | Partial | Real compiler/storage bridge, but AI/expression runners are placeholders |
| Graph executor | Partial | Topological execution exists; dependency input resolution missing/type mismatch exists |
| Custom 3D engine | Framework/scaffold | WebGL lifecycle/plugin runtime; core renderer placeholder |
| NPC simulation bridge | Partial | Architecture exists; incomplete behaviors/compile issues remain |
| WonderPlay AI NPC APIs | Implemented demo/service layer | Real Gemini calls for text/image/video |
| WonderPlay live NPC WebSocket | Demo/scaffold | Randomized visemes and simulated thinking |
| WonderPlay subscriptions | Demo/scaffold | In-memory process state |
| Coder/Kubernetes | Implemented infrastructure / integration blocker | Terraform + client + authenticated UI route; readiness ID bug |
| WonderSpace UI | Mixed | Real Coder UI path plus filesystem-only path |
| Mobile | Partial | Expo/EAS native shell exists; Builder backend is demo fallback |
| Standalone Agent API | Implemented but security-blocked | Real Gemini agent; unauthenticated key creation and hashing defects |
| Licensing | Needs audit | Missing repo license files + upstream dependencies |
| Commercial controls | Partial | Billing/usage schema exists; checkout routing and workspace quotas need fixes |

---

## Priority unresolved dependency queue — next run

1. **Fix/verify Coder readiness identity:** use the Coder-returned workspace ID for Coder polling; verify Supabase user ↔ Coder user identity mapping.
2. **Trace Stripe end-to-end:** public plan card → `/api/subscription/subscribe` → Stripe Checkout Session → webhook URL → Supabase subscription → entitlement/UI metadata.
3. **Trace actual plan entitlements:** follow `useSubscription`, `limits.ts`, pipeline gating and workspace quotas to verify that plan limits are enforced server-side, not only displayed.
4. **Trace AI-PLAYGROUND agent spawn:** follow `onSpawnAgent` from UI through persistence and actual inference/runtime calls.
5. **Trace DreamMakerHub Unified AI:** follow `/api/unified-ai` → `/api/agent`/`spirit-guide`/runner endpoints → actual provider call and determine which backend is authoritative.
6. **Trace pipeline graph execution:** find every caller of `compilePipelineToEngine`, `GraphExecutor.execute`, and pipeline UI actions; establish whether execution ever reaches AI-PLAYGROUND's real provider proxy.
7. **Trace custom-engine/QuadEngineShell/GLB compiler/NPC WebSocket relationships** across the repo and identify duplicate runtimes.
8. **Run/inspect actual build workflows:** determine which compile errors are current versus stale and whether CI validates claimed production builds.
9. **Audit WonderPlay server security:** remove BYOK API-key-from-body behavior, add rate limiting, and replace in-memory subscriptions.
10. **Audit mobile backend:** identify the intended `/build` service, connect authentication, and verify Android/iOS EAS builds.
11. **Audit standalone Agent API security:** authenticate key creation, unify hash/revoke logic, enforce stored rate limits, and require a non-default pepper.
12. **Build licensing BOM:** repository licenses, package licenses, Blender/COLMAP/Meshroom terms, model/provider terms, and distribution rights.
13. **Cost model:** map Coder CPU/RAM/disk/TTL settings and AI token costs to proposed subscription/usage pricing.
14. **Sponsor evidence appendix:** only claim features that code and measured demos substantiate.

---

## Evidence quality rule

Marketing copy, implementation summaries, README claims, screenshots, and architecture documents are treated as **claims** until source code, configuration, live build output, or measured runtime behavior confirms them. The report intentionally distinguishes implemented code, partial implementation, demo/scaffold behavior, stale/duplicate paths, and unresolved dependencies.
