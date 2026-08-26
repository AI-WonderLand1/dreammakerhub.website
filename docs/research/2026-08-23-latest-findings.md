# DreamMakerHub Deep-Dive Addendum — 2026-08-23

## Scope of this run

Follow-up investigation from the 2026-08-22 stopping point. Priority was the newly exposed `AI-WonderLand1/wonderplay-3D` repository, with cross-checks against `dreammakerhub.website` integration assumptions. `AI-PLAYGROUND` remains not directly exposed as a repository through the current GitHub connector, so no new claims are made about its current branch state in this run.

## 1. `wonderplay-3D` is now directly verified as an AI-WonderLand1 repository

Repository: `AI-WonderLand1/wonderplay-3D`

- Public repository, default branch `main`.
- Repository metadata reports no declared GitHub license.
- Latest commits on 2026-08-22 are `3D wiring` (`2344c9b...`) followed by `updated readme` (`aaf1f7b...`).
- The `3D wiring` commit added Supabase SSR/client dependencies, `playcanvas`, `motion`, and a substantial new `src/components/builder/` UI tree.

## 2. Important distinction: the new builder UI is not proven to be the active routed builder

The new `src/components/builder/index.ts` exports a substantial editor surface including:

- `Viewport3D`
- `BehaviorGraphEditor`
- `RealityCapturePipelinePanel`
- `WonderCanvasStats`
- `AssetBrowser`
- `DebugConsole`
- `BottomQuickAssetsDrawer`
- `MovieStudioView`
- `FloatingAiBuilderBubble`
- `ContextMenu`
- `FooterStatusBar`

However, the current `src/App.tsx` still routes `/builder` and `/builder/:templateId` to the older `src/components/BuilderPage.tsx`. That older page was last modified on 2026-08-10 and directly creates a Three.js scene with primitive capsule/sphere NPC geometry, local React state, and a local `isSubscribed` boolean. The new builder barrel is not imported by `App.tsx` in the inspected source.

**Conclusion:** substantial new 3D-builder UI code exists, but its integration into the public route is not yet proven. Treat the new builder surface as implemented components awaiting route/runtime integration, not as a verified end-to-end production builder.

## 3. Current `BuilderPage.tsx` is still demo/scaffold behavior

Verified source behavior includes:

- `isSubscribed` is a local prop/state gate rather than a verified account/billing entitlement.
- The scene is created directly with Three.js.
- NPCs are generated from primitive capsule/sphere geometry rather than loading the compiled GLB/NPC asset pipeline.
- NPC placement, selection, deletion and labels are held in React/local runtime state.
- The page advertises behavior editor, perception preview and export capabilities, but the inspected source does not establish that those advertised systems are wired through the new builder components.

This directly conflicts with the repository's `NPC_SYSTEM_SPEC.md`, which explicitly says the intended implementation must not be a demo/mock/disconnected UI and must use the existing NPC entities, behavior tree, PlayCanvas/WebGL runtime, asset pipeline and project storage.

## 4. `server.ts` contains real Gemini NPC intelligence, but the trust boundary is unsafe for production

Verified endpoints:

- `POST /api/gemini/npc-intelligence`
- `POST /api/gemini/npc-vision`
- `POST /api/gemini/npc-video`

They instantiate the Google GenAI SDK and request structured JSON results. This is real provider integration rather than a static mock.

However, each endpoint accepts `apiKey` directly from the request body and falls back to `GEMINI_API_KEY`. A production browser client should not be trusted to submit arbitrary privileged provider keys to a server that then uses them for model calls. Authentication, authorization, rate limiting, and a defined BYOK policy are required.

## 5. The `/live-npc` WebSocket remains simulated, and the runtime dependency is incomplete

`server.ts` creates a `WebSocketServer({ noServer: true })`, accepts NPC connections, emits initial/randomized viseme frames, and contains a simulated thinking/responding flow.

The current `package.json` includes `@types/ws` but does **not** list the `ws` runtime package under dependencies. Because `server.ts` dynamically imports `ws`, this is a concrete production/build dependency gap unless the deployment environment supplies `ws` indirectly (which must not be assumed).

The server file inspected in this run does not by itself prove a complete HTTP server `upgrade` wiring path for the `noServer: true` WebSocket server. This remains an unresolved runtime integration item and should be traced next.

## 6. Subscription logic inside `wonderplay-3D` is not durable billing

`server.ts` contains `/api/subscriptions/create`, `/api/subscriptions/check`, and `/api/subscriptions/:subscriptionId` routes backed by an in-memory JavaScript object keyed by email.

- Data disappears when the process restarts.
- There is no Stripe integration in this subscription path.
- There is no authentication/ownership check in the inspected handlers.
- A caller can submit an email and tier directly to create a local subscription record.

Therefore this path must not be treated as a production monetization system. The authoritative billing system remains the DreamMakerHub/Stripe work already documented in the master report, subject to its previously identified entitlement reconciliation blockers.

## 7. The repository contains a documentation/implementation split

`IMPLEMENTATION_SUMMARY.md` is dated 2026-08-08 and describes a landing page + contact-form implementation, while the current package and server have evolved into a larger AI NPC/3D builder direction. `NPC_SYSTEM_SPEC.md` is also a specification/instruction document rather than proof of complete runtime implementation.

This means repository documentation must be versioned against actual runtime code before it is used as sponsor-facing technical evidence.

## 8. Licensing/IP finding updated

The GitHub repository metadata for `wonderplay-3D` currently reports no declared GitHub license. This differs from `dreammakerhub.website`, whose repository metadata reports MIT.

Do not infer that the WonderPlay code is MIT-licensed merely because the parent DreamMakerHub repository is. The two repositories require separate license provenance and third-party dependency review.

## 9. Current status after this run

### Verified implemented

- Real Gemini NPC intelligence/vision/video API calls.
- Real React/Three.js builder code.
- Real GLTF/NPC source files and voice/dialogue subsystem files.
- New builder component tree with viewport, behavior graph, asset browser, debug console, pipeline panel and AI-builder UI.
- Supabase and PlayCanvas dependencies have been added to the current WonderPlay package.

### Verified scaffold/demo or not end-to-end

- Routed public BuilderPage still uses primitive Three.js NPCs and local subscription state.
- `/live-npc` response behavior is simulated/randomized.
- WonderPlay subscription routes are in-memory and unauthenticated.
- Contact handling logs submissions rather than persisting/sending them.
- The new builder component tree is not yet proven to be mounted by the public route.

### Unresolved dependencies to investigate next

1. `wonderplay-3D` WebSocket upgrade path for `/live-npc` and the missing `ws` runtime dependency.
2. Whether the new `src/components/builder/` tree has an intended root component and what must replace the legacy `BuilderPage` route.
3. Actual Supabase usage in the new builder components and whether authentication/project persistence is wired.
4. PlayCanvas runtime usage versus the current Three.js legacy builder.
5. Cross-repo connection from DreamMakerHub `/api/npc/live` into WonderPlay's live NPC server.
6. Reconcile the WonderPlay NPC voice specification with the actual `VoiceProvider`, `DialogueManager`, animation and asset pipeline consumers.
7. Re-check the DreamMakerHub billing/entitlement chain once the directly accessible repository state is mapped against the latest commits.

## Evidence links

- `AI-WonderLand1/wonderplay-3D` repository
- Commit `2344c9b` — `3D wiring`
- Commit `aaf1f7b` — `updated readme`
- `src/App.tsx`
- `src/components/BuilderPage.tsx`
- `src/components/builder/index.ts`
- `server.ts`
- `package.json`
- `NPC_SYSTEM_SPEC.md`
- `IMPLEMENTATION_SUMMARY.md`
