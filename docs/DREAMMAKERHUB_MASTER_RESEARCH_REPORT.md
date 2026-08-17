# DreamMakerHub Master Technical & Commercial Research Report

_Last updated: 2026-08-17_

## Scope

This is the running evidence-based research record for DreamMakerHub / AI-WonderLand and connected repositories. The investigation prioritizes `dreammakerhub.website`, `AI-PLAYGROUND`, and `wonderplay-3D`, with emphasis on engine customization, AI/NPC systems, WonderSpace/Coder/Kubernetes integration, pipelines, realtime infrastructure, mobile integration, security, licensing/IP, monetization, and production readiness.

## Executive status

**Overall:** ambitious architecture with several real working subsystems, but significant portions remain scaffolding, placeholders, or unverified integration paths. The strongest current production-oriented code is in `AI-PLAYGROUND` (provider proxy, Supabase persistence/realtime, subscription schema). The `custom-engine` package in `dreammakerhub.website` is currently much less production-ready than its README claims: the core renderer only clears the WebGL buffer, there are compile-blocking source issues, and the external AI plugin returns placeholder text.

`wonderplay-3D` currently reads as a **3D development environment/tooling repository**, not a custom game engine. It provisions Blender + COLMAP through Nix and downloads Meshroom 2025.1.0 (~14 GB) into a vendor directory.

## Evidence reviewed this run

### 1. dreammakerhub.website — custom-engine

#### `custom-engine/src/engine.ts`

- Real TypeScript `CustomEngine` class with initialization, WebGL context acquisition, scene-object storage, plugin lifecycle, event listeners, animation loop, and status reporting.
- Initialization requests WebGL2/WebGL/experimental-webgl and enables depth testing.
- The main render loop clears the color/depth buffers and calls `renderScene()`.
- **Critical limitation:** `renderScene()` is explicitly a placeholder and does not iterate scene objects or draw geometry. The file itself states that visual plugins are expected to extend this.
- Plugin lifecycle is real: initialize, enable/disable, remove, dispose, metadata lookup.
- This means the core is a framework/runtime shell, not yet a full standalone renderer.

#### `custom-engine/src/plugin.ts`

- Real plugin contract with lifecycle methods and metadata/dependency declarations.
- **Potential compile issue:** `PluginContext` refers to `CustomEngine`, but the file contains no import/type declaration for `CustomEngine`.

#### `custom-engine/src/index.ts`

- **Critical path issue:** located under `custom-engine/src/` but exports from `./src/engine`, `./src/plugin`, etc. From that location these paths resolve toward `custom-engine/src/src/...`, not the sibling files shown in the package.
- This should be verified with an actual TypeScript build; it is a likely compile blocker.

#### `custom-engine/src/ai.ts`

- NPC simulation plugin architecture is real in concept and code: it expects a simulation tick/state/event interface, can auto-tick on a timer, processes decisions, maps actions to visual NPC animation/dialogue, and subscribes to simulation events.
- **Critical source issue:** the initial-NPC loop is written as `for const npc of this.initialNPCs`, which is invalid TypeScript syntax and should prevent compilation as committed.
- The `ExternalAIPlugin` stores provider/model/API-key configuration but `generateText()` explicitly returns a fabricated placeholder string rather than calling an external provider.
- Therefore the NPC simulation adapter is partly implemented, while the generic external-AI dialogue path is scaffolded.

#### `custom-engine/package.json` / `tsconfig.json`

- Package declares `build: tsc`, strict TypeScript, `noImplicitAny`, `noImplicitReturns`, `noUnusedLocals`, and `noUnusedParameters`.
- Package metadata says MIT, but `custom-engine/LICENSE` was not found during this run. The declared license should therefore be treated as **unverified at repository level** until a license file or root licensing policy is confirmed.

### 2. AI-PLAYGROUND

#### `server/index.ts`

- Real Express server on port 3001 with static serving, `/api/chat`, `/api/chat/stream`, `/api/health`, templates, and conditional Stripe webhook mounting.
- Chat endpoints require a Wonderland key and validate it before calling model providers.
- Streaming forwards upstream response bytes as SSE.
- **Security/production concern:** `cors()` is enabled with no visible origin restriction; production deployment should explicitly constrain allowed origins.
- **Production concern:** streaming path assumes `providerResponse.body` is present.

#### `server/providers/registry.ts`

- Real provider registry with OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together, Fireworks, DeepSeek, Perplexity, xAI and Google Gemini configurations.
- API keys are read from server environment variables rather than client code.
- `MODEL_ROUTES` maps many user-facing IDs to OpenRouter routes.
- **Scaffolding:** Replicate and Hugging Face provider entries currently have empty request builders and return `Empty response received.`; they are registry placeholders, not working provider implementations.
- Anthropic path sets `anthropic-dangerous-direct-browser-access`; since this request is made server-side, that header is unnecessary and should be reviewed/removed.

#### `src/hooks/useRealtimeSync.ts`

- Real Supabase realtime synchronization for `agents`, `workflows`, and `memories`.
- Loads initial per-user state, subscribes to Postgres changes filtered by authenticated `user_id`, and exposes upsert/delete helpers.
- This is meaningful cross-app synchronization infrastructure, not merely UI mock data.

#### `supabase-schema.sql`

- Real Auth-linked `profiles`, `agents`, `usage_logs`, `subscriptions`, `memories`, and `workflows` tables.
- Row Level Security is enabled on these tables with user-scoped policies.
- Realtime publication is explicitly enabled for `usage_logs`, `memories`, `workflows`, and `agents`.
- `usage_logs` already carries model, token counts, cost, duration, and status — useful groundwork for usage-based monetization.
- `subscriptions` stores Stripe customer/subscription IDs, plan ID, status, billing periods and cancellation state.

#### `server/stripe-webhook.ts`

- Real Stripe signature verification is implemented with `constructEvent()`.
- Handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_succeeded`.
- Subscription state is upserted/updated in Supabase.
- **Important route-integration issue to verify:** `server/index.ts` mounts the router at `/api/stripe/webhook`, while the router itself defines `POST /stripe/webhook`. This composes to `/api/stripe/webhook/stripe/webhook`, not the likely intended `/api/stripe/webhook`, unless an external route intentionally targets the doubled path.
- This should be fixed or explicitly verified before using the Stripe webhook in production.

#### `src/utils/nodeExec.ts`

- Contains real deterministic local operations (hashing, vector embedding, cosine similarity, browser persistence, JSON utilities, document processing) and real public/API integrations for Wikipedia, RSS, Perplexity, Pushbullet, SerpAPI, Wolfram Alpha, YouTube, etc.
- The vector store in this file is browser `localStorage`, so it is useful for lightweight/local workflows but should not be represented as a production shared vector database.

### 3. wonderplay-3D

#### `README.md`

- Describes a 3D tools development environment using Blender and Meshroom, with COLMAP also included.
- Quick start is `nix-shell`, `./setup.sh`, `blender`, and Meshroom wrapper commands.
- This repository does **not** currently read like the implementation of a proprietary 3D engine; it is primarily a reproducible toolchain/dev environment.

#### `shell.nix`

- Provides Blender, COLMAP, Python 3, pip, NumPy, and OpenCV through Nix.
- Shell hook reports installed Blender/COLMAP versions.

#### `setup.sh`

- Downloads Meshroom `2025.1.0` from a Zenodo URL, roughly 14 GB, extracts it into `vendor/`, and deletes the tarball.
- `vendor/` is described as gitignored in the README.
- **Licensing/IP follow-up:** Blender, COLMAP, and Meshroom have their own upstream licenses/terms. The repo itself has no `LICENSE` file found in this run. We must inventory the exact redistributable components and whether any binaries are merely developer dependencies or will ship to end users.

## Cross-repository architecture findings

### Strong / implemented

1. AI-PLAYGROUND has a real server-side model proxy and a broad provider registry.
2. AI-PLAYGROUND has authenticated Supabase persistence and realtime synchronization.
3. AI-PLAYGROUND has Stripe subscription persistence and webhook processing, subject to the route issue above.
4. DreamMakerHub custom-engine has a genuine plugin/event/scene-object runtime skeleton.
5. DreamMakerHub custom-engine has a real interface concept for connecting NPC simulation results to visual NPC state.
6. WonderPlay 3D has a reproducible 3D tooling environment using Nix.

### Partially implemented / scaffolded

1. Custom-engine rendering is currently a WebGL clear loop; actual geometry rendering is delegated to future visual plugins.
2. External AI dialogue in custom-engine is a placeholder response.
3. Replicate and Hugging Face provider entries are stubs.
4. Some model routes appear to be catalog/route declarations rather than verified live-provider support.
5. WonderPlay 3D is tooling infrastructure rather than demonstrated integration into the DreamMakerHub runtime.

### Unresolved integration boundaries

- Exact path from DreamMakerHub website UI → pipeline storage → graph compiler → execution runner → AI provider → engine runtime → realtime result.
- Exact repository containing the claimed Coder/Kubernetes/WonderSpace orchestration layer. No clearly matching repository was discoverable under the searched AI-WonderLand1 organization during this run; treat that layer as **unresolved**, not assumed implemented.
- Exact mobile build/export path. No `capacitor.config.ts` or `android/app/build.gradle` was found in AI-PLAYGROUND during this run; mobile integration therefore remains unverified there.
- Exact location and implementation status of `pipelines.ts`, `QuadEngineShell`, GLB compiler, and live NPC WebSocket runtime referenced in prior research notes. These remain priority files to re-trace from the repository tree.

## Security findings

- Positive: model API keys are server-side environment variables in AI-PLAYGROUND.
- Positive: Supabase RLS policies are user-scoped for core user data.
- Positive: Stripe webhook signature verification is present.
- Concern: global permissive CORS in the Express server.
- Concern: any client-controlled Wonderland key mechanism must be assessed for replay/abuse and rate limits.
- Concern: `usage_logs` is user-readable but no insert policy is shown; confirm whether logs are written only by trusted server-side code.
- Concern: external API helpers in `nodeExec.ts` accept API keys from node configuration; ensure these values cannot be persisted or exposed to untrusted users/workflows.
- Concern: the custom engine README claims API-key management, but the generic external AI implementation currently does not actually call providers.

## Monetization readiness

The architecture already contains useful commercial primitives:

- Stripe customer/subscription identifiers.
- Subscription plan IDs and lifecycle state.
- Usage logging with token counts, cost and duration.
- Realtime dashboards/data synchronization.

Immediate blocker: verify/fix the Stripe webhook route composition and trace the actual checkout/payment-link creation code end-to-end.

The existing sponsorship program should remain separate from product subscription revenue. Sponsorship is project support, not an investment offering.

## Licensing / IP status

- `custom-engine/package.json` declares MIT, but no `custom-engine/LICENSE` file was found.
- `wonderplay-3D` has no `LICENSE` file found in this run.
- WonderPlay's direct use/download of Blender, COLMAP and Meshroom requires an upstream-license inventory before commercial redistribution or bundling.
- Any future claim that DreamMakerHub is an original "custom Unreal Engine 5" should be avoided until all upstream engine code, licenses, modifications, and distribution rights are mapped. Current evidence reviewed here supports a custom WebGL engine shell, not an Unreal-derived engine.

## Production-readiness scorecard (evidence-based, provisional)

| Area | Status | Evidence |
|---|---|---|
| AI provider proxy | Partially production-oriented | Real server proxy and provider registry; some provider stubs |
| Realtime sync | Implemented foundation | Supabase Postgres realtime + user filtering |
| Subscription persistence | Implemented foundation | Stripe IDs/status in Supabase |
| Stripe webhook | Implemented but integration issue | Signature verification + lifecycle handlers; route composition needs verification |
| Custom 3D engine | Framework/scaffold | Real WebGL lifecycle/plugin runtime; renderScene is placeholder |
| NPC simulation bridge | Partial | Real adapter structure; source compile issue and incomplete visual behaviors |
| External NPC AI | Stub | `generateText()` returns placeholder text |
| WonderPlay 3D | Toolchain | Blender/COLMAP/Nix/Meshroom setup; not proven integrated runtime |
| Mobile | Unverified | No Capacitor/Android build files found in AI-PLAYGROUND |
| Coder/Kubernetes/WonderSpace | Unresolved | Matching repo/path not yet traced |
| Licensing | Needs audit | Declared MIT vs missing LICENSE; upstream 3D tools need inventory |

## Next investigation queue

1. Trace and verify the Stripe checkout/payment-link creation path and correct webhook route.
2. Locate `pipelines.ts`, pipeline compiler/runner, and database records; trace a pipeline from persisted graph to execution.
3. Locate `QuadEngineShell` and determine whether the dummy canvas/React renderer creates a duplicate runtime or is intentional.
4. Locate GLB compiler, NPC WebSocket runtime and simulation service; verify whether binary/audio/viseme data is real or placeholder.
5. Trace all imports between `dreammakerhub.website` and `AI-PLAYGROUND`; identify duplicated models, APIs, and shared Supabase contracts.
6. Identify the Coder/Kubernetes/WonderSpace repository or prove that integration is currently external/uncommitted.
7. Audit mobile build/export paths and Android/iOS packaging.
8. Build an IP/license bill of materials for all upstream dependencies and bundled/downloaded tools.
9. Run/inspect actual build/test scripts where the connected GitHub tooling exposes them; distinguish compile errors from theoretical concerns.
10. Convert verified architecture into a sponsor-facing technical evidence appendix so marketing claims stay ahead of hype but behind the code.
