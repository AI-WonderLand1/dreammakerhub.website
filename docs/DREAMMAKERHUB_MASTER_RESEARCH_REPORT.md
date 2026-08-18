# DreamMakerHub Master Technical & Commercial Research Report

_Last updated: 2026-08-18_

## Scope

Evidence-based running research record for DreamMakerHub / AI-WonderLand and connected repositories. Priority: `dreammakerhub.website`, `AI-PLAYGROUND`, and `wonderplay-3D`, with emphasis on engine customization, AI/NPC systems, WonderSpace/Coder/Kubernetes integration, pipelines, realtime infrastructure, mobile integration, security, licensing/IP, monetization, and production readiness.

## Executive status

**Overall:** the project contains substantially more real infrastructure than a simple marketing prototype, but it is a mixed-state codebase. Several important subsystems are implemented and connected, while other paths are architectural shells, duplicated implementations, placeholders, or stale/demo code. The strongest evidence today is the combination of AI-PLAYGROUND's server/provider/realtime/billing foundation and DreamMakerHub's real Coder/Kubernetes workspace infrastructure. The weakest areas remain the custom engine renderer, pipeline execution bridge, parts of NPC runtime behavior, mobile packaging, and licensing documentation.

**Important correction from prior runs:** Coder/Kubernetes/WonderSpace is **not merely unresolved**. `dreammakerhub.website` contains a real Coder client, authenticated workspace provisioning route, Coder/Kubernetes Terraform template, WonderSpace IDE launch UI, workspace persistence, and PlayCanvas 3D template. However, there are also parallel/stale workspace routes that only write local/Supabase records and do not provision Coder. The integration therefore exists, but the public UI path is not yet proven to use the real Coder provisioning path consistently.

**Important correction about `wonderplay-3D`:** the repository is not only a Blender/Meshroom toolchain. Its current `package.json`, server, landing page, Gemini NPC APIs, and WebSocket code show a second/active direction as a **web-native AI NPC orchestration engine**. At the same time, its README still describes it as a 3D tools development environment. The repository is therefore internally inconsistent/staged across two product directions and needs consolidation.

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
- **Critical implementation gap:** `evaluateExpression()` returns the expression string rather than evaluating it, despite the comment saying AI-PLAYGROUND has an expression parser.
- **Security naming problem:** `encodePipelineConfig()` and `encodeNodeConfig()` only Base64-encode JSON. Base64 is not encryption. Any claim that pipeline configuration is encrypted is currently false based on this implementation.
- Node mapping exists, but several mappings are placeholders/semantically weak: `trigger`, `if`, `split`, `merge`, `git` are mapped to `engine.render`; this is not evidence of specialized runtime behavior for those node types.

#### `engine/core/execution/executor.ts`

- A real topological-sort/runner architecture exists.
- Runners are registered by node type and execution status is tracked.
- **Critical compile/type issue:** the executor calls `graph.getAllNodes()`, but `ExecutionGraph` in `engine/core/execution/types.ts` is a plain interface with `nodes: Record<string, ExecutionNode>` and no `getAllNodes()` method.
- **Critical runtime gap:** `resolveInputs()` explicitly returns `node.inputs` and comments that the real dependency-output mapping is not implemented.
- Therefore the graph executor is a real execution framework but not yet a complete dataflow engine.

#### `engine/core/pipeline-runner.ts`

- Real Supabase-backed pipeline loading and compilation path exists.
- `loadPipelineFromTemplate()` reads `pipeline_templates`, compiles through `PipelineToEngineCompiler`, and writes an engine-oriented record back.
- `compilePipelineToEngine()` checks subscription tier and organization/user/public access, compiles the pipeline, records compilation results, increments usage, and returns compilation metadata.
- `saveCompiledEngine()` persists compiled engines and grants pipeline user access, then broadcasts `engine:compiled` through a Supabase channel.
- `getAvailablePipelines()` filters available templates by status, search, subscription level, ownership, organization, and public access.
- **Security concern:** the server-only Supabase client is created with `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY`. A service-role fallback to an anon key is operationally dangerous because failure to configure the service key can silently change privilege behavior.
- **Integration conclusion:** the pipeline storage/compilation layer is real, but the actual AI execution path is not end-to-end because the compiler's AI runner and expression runner are placeholders and the executor's input resolution is incomplete.

### 2. `dreammakerhub.website` — Coder / Kubernetes / WonderSpace

#### `.opencode/skills/coder-workspace-integration/SKILLS.md`

- Documents a real Civo Kubernetes cluster, Coder instance, `node-ide`, `python-ide`, and `wonderspace-ide` templates, and a Railway deployment target.
- Explicitly instructs server-side use of Coder credentials and asynchronous build polling.
- This file is operational guidance, not proof by itself, but the repository contains matching implementation files below.

#### `infra/coder/template/main.tf`

- Real Terraform using the Coder and Kubernetes providers.
- Defines CPU, memory, disk, TTL/autostop parameters.
- Creates a Coder agent, code-server app, persistent volume claim, and Kubernetes deployment.
- Runs code-server bound to localhost so Coder proxy handles access.
- Creates an SSH key and starts SSH inside the workspace.
- Runs workspace containers as non-root user 1000.
- This is substantive infrastructure, not a mock configuration.

#### `packages/coder-workspace/src/coder-client.js`

- Real Coder REST client using `Coder-Session-Token`.
- Implements workspace listing, creation, start/stop/delete, build operations, build logs, readiness polling, file upload, template listing, AI bridge inspection, AI provider CRUD, and agent inspection.
- Workspace creation sends `template_id`, `name`, and rich parameter values for CPU, memory, and disk.
- File upload explicitly rejects path traversal and invalid paths.
- This is one of the strongest verified infrastructure components in the project.

#### `apps/web/lib/coder/api-wrapper.ts`

- Higher-level Coder wrapper persists workspace metadata in Supabase, builds access URLs, polls readiness, manages workspace lifecycle and maps Coder status into app status.
- Supports WonderSpace and PlayCanvas template paths.
- Uses server-side configuration and a Supabase persistence layer.
- `createWorkspaceForApp()` is used by the user-workspace provisioning route.

#### `apps/web/app/api/user-workspace/provision/route.ts`

- Authenticates through Supabase.
- Validates workspace name and allowed pod type (`ide` or `playcanvas`).
- Maps those types to `wonderspace-ide` and `playcanvas-3d`.
- Obtains a user SSH key and calls the real `CoderAPIWrapper` with Coder API credentials.
- Returns workspace/IDE URL and SSH command.
- This proves a genuine authenticated user → DreamMakerHub → Coder API provisioning path exists.

#### `apps/web/app/wonderspace/ide/page.tsx` and `apps/web/app/api/wonderspace/projects/route.ts`

- The WonderSpace launch UI lets a user choose workspace name, owner, platform (`web`, `ios`, `android`, `multi`), and an IDE image tag.
- **Critical mismatch:** the UI POSTs to `/api/wonderspace/projects`, whose implementation stores projects in `data/wonderspace-projects.json` using local filesystem I/O. It does **not** call Coder.
- The platform selector is metadata only in this route; it does not prove native iOS/Android build support.
- Therefore the branded WonderSpace UI currently has a **mock/local project creation path** alongside a separate real Coder provisioning API.

#### `apps/web/app/api/workspace/provision/route.ts`

- Another workspace route only creates a Supabase `workspaces` record with `status: READY` after checking the scene ID.
- It does not call Coder.
- This is a second stale/placeholder provisioning path that can falsely report a workspace as provisioned.

#### `apps/web/components/BuildIDEButton.tsx`

- Calls `/api/build-ide` and redirects to `workspaceUrl` on success.
- No matching `/api/build-ide` implementation was located in this run.
- This component is therefore a likely stale/dead path unless the endpoint exists outside the searched tree.

**Coder/WonderSpace conclusion:** real infrastructure exists and is fairly substantial, but there are at least three workspace creation patterns in the repo: real Coder provisioning, Supabase-only provisioning, and filesystem-only WonderSpace project creation. These need to be consolidated so production UI cannot accidentally use a fake path.

### 3. `AI-PLAYGROUND` — workflow/agent architecture

#### `src/data/workflowTemplates.ts`

- Contains real workflow templates with trigger, HTTP, code, AI-agent, IF, split, merge, loop, and schedule nodes.
- Templates reference actual model IDs such as `gemini-3-flash-preview` and define system prompts and node configurations.
- This demonstrates a meaningful visual workflow model, but templates alone do not prove that every node type executes correctly in production.

#### `src/components/AgentCompiler.tsx`

- UI allows users to choose a base model, system prompt, web search, code execution, vision, memory, training sources, and then “Compile & Spawn Agent.”
- The component itself delegates the actual spawn action to `onSpawnAgent`; the true persistence/runtime path must be traced from the parent application.

#### `src/App.tsx`

- Uses Supabase session/auth and `useRealtimeSync`.
- Seeds multiple specialized agents (Alice, Simple Rick, Neo, Atlas, Sage, Echo, Nova, Cipher) with different models and roles.
- Syncs agents from Supabase into the active module list.
- Also retains localStorage memories/events, meaning the app mixes durable server state with local browser state.
- This is evidence of a real agent-oriented UI, but some seeded values are demonstration data and should not be treated as live autonomous agents without tracing the spawn/inference path.

### 4. `AI-PLAYGROUND` — model provider layer

#### `server/providers/registry.ts`

- Real provider configurations exist for OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together, Fireworks, DeepSeek, Perplexity, xAI, and Google Gemini.
- Server-side environment variables hold provider keys.
- Many model IDs are routed through OpenRouter.
- Replicate and Hugging Face entries remain stubs with empty request builders and placeholder responses.
- Anthropic requests include `anthropic-dangerous-direct-browser-access` even though the request originates server-side; this header should be removed/reviewed.
- The provider layer is a real commercial foundation, but the model catalog contains many route declarations that still require live-provider verification.

### 5. `AI-PLAYGROUND` — realtime and billing

- `useRealtimeSync.ts` implements authenticated Supabase realtime for agents, workflows and memories.
- `supabase-schema.sql` contains Auth-linked profiles, agents, usage logs, subscriptions, memories and workflows with RLS.
- Realtime publication is enabled for core tables.
- `usage_logs` includes model, prompt/completion/total tokens, cost, duration and status.
- `subscriptions` stores Stripe customer/subscription IDs, plan, status, billing periods and cancellation state.
- Stripe webhook code verifies signatures and handles checkout completion, subscription updates/deletion, and successful invoices.
- **Route issue remains:** `server/index.ts` mounts the Stripe router under `/api/stripe/webhook` while the router defines `/stripe/webhook`; this composes to `/api/stripe/webhook/stripe/webhook` unless intentionally routed elsewhere. Must be verified/fixed before production billing.
- Global CORS remains permissive in the Express server and should be restricted for production.

### 6. `wonderplay-3D` — corrected repository assessment

#### `package.json`

- Current package name is `custom-npc-orchestration-engine`.
- Build script is `vite build && tsc --project tsconfig.json`.
- Dependencies include `@gltf-transform/core`, Google GenAI SDK, React, Three.js, Express and Three standard libraries.
- This is evidence of an active web NPC-engine direction, not just a tools-only repo.

#### `server.ts`

- Real Express server exposes Gemini-backed NPC intelligence, vision and video-analysis endpoints.
- Intelligence endpoint sends NPC stats/behavior state to Gemini and requests structured JSON decisions including action, command, thought, animation and updated AI mode.
- Vision endpoint accepts image data and requests structured object/threat analysis.
- Video endpoint accepts base64 video and requests structured reconnaissance analysis.
- Contact endpoint is real but only logs submissions; it does not send/store them durably.
- Subscription endpoints are **in-memory only**: they store email/tier/expiry in a process-local object and reset on restart. They are not production billing.
- WebSocket server exists for `/live-npc` and sends viseme frames plus simulated NPC behavior.
- **Critical limitation:** the WebSocket section explicitly says it simulates NPC thinking/responding and emits random viseme values. This is demo behavior, not proof of real lip-sync or a persistent live NPC brain.
- **Security concern:** Gemini endpoints accept an API key from the request body (`apiKey`) as an alternative to server environment configuration. A production version should not accept privileged provider keys from arbitrary browser clients.
- `express.json` allows 50 MB payloads; this is useful for image/video demos but requires rate limits and abuse controls in production.

#### `src/components/LandingPage.tsx`

- Marketing page claims intelligent reasoning, visual perception, behavior control, web-native Three.js, “sub-100ms latency,” and a live demo.
- The 3D preview is visually simulated UI; the actual server path is remote Gemini inference.
- The latency claim is not substantiated by telemetry in the inspected code and should not be used in sponsor material without measurement.

#### `IMPLEMENTATION_SUMMARY.md`

- Claims successful build, working landing page, contact API, and production-ready bundle.
- This is documentation authored by the project, not independent build evidence. It must be reconciled against the current source and an actual CI/build run.

#### `README.md`

- Still describes the repo as a Blender/Meshroom/COLMAP 3D development environment and says Meshroom is downloaded at ~14 GB.
- This conflicts with the current `package.json`, server, and React NPC product direction.
- The repository needs a single authoritative README and product scope.

#### Nix/toolchain files

- Blender/COLMAP/Python/NumPy/OpenCV and Meshroom tooling remain present.
- Upstream licensing must be inventoried before any redistribution/bundling.

**WonderPlay conclusion:** the repo now has a real AI/NPC API/server direction plus a separate 3D tooling direction. The server-side AI endpoints are implemented enough to demonstrate provider calls, but the live NPC WebSocket behavior and subscriptions are demo/scaffold behavior. The repo should be split or clearly organized into product runtime vs developer toolchain if both are intentional.

---

## Cross-repository architecture findings

### Strong / implemented foundations

1. AI-PLAYGROUND server-side provider proxy and broad model registry.
2. AI-PLAYGROUND authenticated Supabase persistence and realtime synchronization.
3. AI-PLAYGROUND subscription schema and Stripe webhook handling foundation.
4. DreamMakerHub custom engine plugin/event/scene runtime skeleton.
5. DreamMakerHub pipeline compiler, pipeline persistence, graph executor framework, and subscription-aware pipeline access logic.
6. Real Coder API client and Coder/Kubernetes workspace infrastructure.
7. Real user-authenticated DreamMakerHub → Coder workspace provisioning route.
8. WonderPlay-3D Gemini NPC intelligence/vision/video endpoints.
9. WonderPlay-3D WebSocket endpoint exists, though current behavior is simulated.

### Partially implemented / scaffolded

1. Custom-engine rendering: WebGL clear loop; no real geometry renderer in core.
2. External AI in custom-engine: placeholder response.
3. Pipeline AI runner: placeholder response instead of AI-PLAYGROUND provider integration.
4. Pipeline expression evaluation: placeholder.
5. Graph executor dependency-input resolution: not implemented.
6. Replicate/Hugging Face provider adapters: stubs.
7. WonderSpace UI project creation: filesystem JSON rather than Coder provisioning.
8. Separate workspace route: Supabase record only.
9. BuildIDEButton: points to an endpoint not located in this run.
10. WonderPlay WebSocket visemes: randomized simulation.
11. WonderPlay subscriptions: in-memory demo state.
12. Mobile platform selector: UI metadata, not native packaging evidence.

### Resolved integration boundary: Coder/Kubernetes/WonderSpace

The previously unresolved Coder layer is now traced sufficiently to classify it as **implemented infrastructure with inconsistent UI routing**:

`WonderSpace/user UI` → `user-workspace/provision` → `CoderAPIWrapper` → Coder `/api/v2` → Kubernetes workspace/template → code-server/WonderSpace environment.

A parallel UI path is:

`WonderSpace IDE launch page` → `/api/wonderspace/projects` → local `data/wonderspace-projects.json` → `/ide`.

These are not equivalent. The second path does not provision a Coder workspace.

---

## Security findings

### Positive

- AI-PLAYGROUND provider keys are server-side environment variables.
- Supabase RLS exists on core user data.
- Stripe signature verification exists.
- Coder client uses session-token headers and server-side API configuration.
- Coder file upload contains explicit path traversal/invalid-path checks.
- User-workspace route authenticates the Supabase user before provisioning.
- Kubernetes workspace template runs as non-root UID 1000.

### Concerns

- AI-PLAYGROUND global CORS is permissive.
- Client-controlled Wonderland-key mechanism needs rate-limit/replay analysis.
- `nodeExec.ts` accepts API keys through node configuration; exposure/persistence must be audited.
- WonderPlay accepts Gemini API keys from request bodies.
- WonderPlay allows very large JSON payloads without evidence of production rate limiting.
- `pipeline-runner.ts` falls back from service-role Supabase key to anon key.
- Base64 is labeled as encryption in pipeline code.
- Multiple workspace endpoints can report “provisioned/ready” without actually provisioning Coder.
- Workspace image/owner/platform inputs need authorization and quota controls before public provisioning.
- Code-server is launched with `--auth none` but bound to localhost and intended to sit behind Coder; deployment must preserve that network boundary.
- SSH keys are generated/managed in workspace infrastructure; key lifecycle and revocation need a formal security review.

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

### Best near-term commercial architecture

A hybrid model remains supported by the evidence:

**Subscription = capability/access**

**Usage = expensive compute/AI/build consumption**

Potential metered resources include AI inference, cloud workspace hours, builds, storage and high-cost generation.

### Immediate commercial blockers

1. Verify/fix Stripe webhook route composition.
2. Trace actual checkout/payment-link creation.
3. Ensure real billing state cannot be confused with WonderPlay's in-memory subscription demo.
4. Define Coder workspace quotas and cost controls before offering cloud workspaces broadly.
5. Consolidate fake/local workspace routes so public users cannot receive a false “ready” state.

### Sponsorship

The founding sponsorship program should remain separate from product subscriptions. Sponsorship is project support and promotional/technology partnership, not an investment or promise of financial return.

---

## Licensing / IP status

- `custom-engine/package.json` declares MIT, but repository-level `custom-engine/LICENSE` was not found in the inspected tree. Treat the declared license as unverified until a license file/root policy is confirmed.
- `wonderplay-3D` has no repository `LICENSE` found in the inspected root.
- WonderPlay directly references/downloads Blender, COLMAP and Meshroom tooling; exact upstream licenses and redistribution obligations must be inventoried.
- WonderPlay dependencies include Three.js, glTF Transform, Google GenAI and Express; dependency licenses must be captured in a commercial bill of materials.
- Any statement that DreamMakerHub is a “custom Unreal Engine 5” should be avoided until upstream source/license provenance is established. Evidence reviewed here supports a custom WebGL runtime plus Three.js-based tooling, not an Unreal-derived engine.
- No evidence in this run establishes that DreamMakerHub owns exclusive rights to every upstream asset, model, binary, provider route, or downloaded tool.

---

## Mobile integration status

- AI-PLAYGROUND: no native Capacitor/Android/iOS build files located in this run.
- DreamMakerHub WonderSpace UI has `web`, `ios`, `android`, and `multi` selectors, but its current project API stores platform metadata in JSON and does not build native apps.
- No verified Android/iOS packaging pipeline was established in this run.
- **Status: UI intent exists; native build/export implementation remains unverified.**

---

## Production-readiness scorecard

| Area | Status | Evidence |
|---|---|---|
| AI provider proxy | Partially production-oriented | Real provider proxy; some provider stubs |
| AI-PLAYGROUND realtime | Implemented foundation | Supabase realtime + authenticated user filtering |
| Subscription persistence | Implemented foundation | Stripe IDs/status in Supabase |
| Stripe webhook | Implemented but route must be verified | Signature verification + lifecycle handlers |
| Pipeline compiler | Partial | Real compiler/storage bridge, but AI/expression runners are placeholders |
| Graph executor | Partial | Topological execution exists; dependency input resolution missing and type mismatch exists |
| Custom 3D engine | Framework/scaffold | WebGL lifecycle/plugin runtime; core renderer placeholder |
| NPC simulation bridge | Partial | Architecture exists; incomplete behaviors/compile issues remain |
| WonderPlay AI NPC APIs | Implemented demo/service layer | Real Gemini calls for text/image/video |
| WonderPlay live NPC WebSocket | Demo/scaffold | Randomized visemes and simulated thinking |
| WonderPlay subscriptions | Demo/scaffold | In-memory process state |
| Coder/Kubernetes | Implemented infrastructure | Terraform + Coder client + authenticated provisioning route |
| WonderSpace UI | Mixed | One real Coder path plus filesystem-only project path |
| Mobile | Unverified | Platform selector only; no native build pipeline traced |
| Licensing | Needs audit | Missing repo license files + upstream dependencies |
| Commercial controls | Partial | Billing/usage schema exists; workspace quotas/real checkout need verification |

---

## Priority unresolved dependency queue — next run

1. **Trace Stripe end-to-end:** checkout/payment links → webhook URL → Supabase subscription record → UI entitlement.
2. **Trace Coder end-to-end from the actual public dashboard:** identify which UI component calls `user-workspace/provision` versus the filesystem-only WonderSpace route; eliminate ambiguity.
3. **Trace `createWorkspaceForApp()` fully** and verify exact Coder payload/template parameters and readiness semantics.
4. **Trace pipeline graph execution:** find every caller of `compilePipelineToEngine`, `GraphExecutor.execute`, and pipeline UI actions; establish whether execution ever reaches AI-PLAYGROUND's real provider proxy.
5. **Trace AI-PLAYGROUND agent spawn:** follow `onSpawnAgent` from UI through persistence and actual inference/runtime calls.
6. **Trace custom-engine/QuadEngineShell/GLB compiler/NPC WebSocket relationships** across the repo and identify duplicate runtimes.
7. **Run/inspect actual build workflows:** determine which compile errors are current versus stale branches and whether CI validates the claimed production builds.
8. **Audit WonderPlay server security:** remove BYOK API-key-from-body behavior for production, add rate limiting, and replace in-memory subscriptions.
9. **Audit mobile packaging:** search all repos for Gradle, Xcode, Capacitor, React Native, Expo, Tauri, or equivalent build artifacts.
10. **Build licensing BOM:** repository licenses, package licenses, Blender/COLMAP/Meshroom terms, model/provider terms, and distribution rights.
11. **Cost model:** map Coder CPU/RAM/disk/TTL settings and AI token costs to proposed subscription/usage pricing.
12. **Sponsor evidence appendix:** only claim features that the code and measured demos can substantiate.

---

## Evidence quality rule

Marketing copy, implementation summaries, README claims, screenshots, and architecture documents are treated as **claims** until source code, configuration, live build output, or measured runtime behavior confirms them. The report intentionally distinguishes implemented code, partial implementation, demo/scaffold behavior, stale/duplicate paths, and unresolved dependencies.
