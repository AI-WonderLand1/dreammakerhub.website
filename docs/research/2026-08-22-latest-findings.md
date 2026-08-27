# DreamMakerHub Deep-Dive Addendum — 2026-08-22

## Executive update

The latest source trace materially changes the NPC and AI-PLAYGROUND assessments. The repository set is now confirmed to include `dreammakerhub.website`, `AI-PLAYGROUND`, and `wonderplay-3D` under the `AI-WonderLand1` organization. The current evidence shows active cleanup/consolidation in both DreamMakerHub and AI-PLAYGROUND, while a new cross-repository runtime mismatch remains unresolved in the WonderPlay NPC path.

## 1. DreamMakerHub removed the standalone NPC-simulation scaffold from the public Studio

Commit `b41b45e6334a33024df6d191c0deac6e1a26b52d` (`refactor: remove NPC AI sim, keep wonderplay-3D pipeline`, 2026-08-22) removed the public `StudioNPCSim` page and its 705-line implementation from `apps/web/components/studio/StudioNPCSim.tsx`. It also removed `mock-npc-sim-server.js`, `npc-sim-plan.md`, and the entire `npc-sim/` package (API/server, decision layer, intent, needs, relationships, tick/timing, utility AI, schema/seeds, package and local DB). `StudioApp.tsx` no longer exposes the `npc-sim` page, and the WonderBuild/3DHub copy no longer advertises NPC simulation as a Studio tool.

**Interpretation:** this is a positive cleanup of an obvious scaffold/demo branch. The public Studio is no longer presenting that deleted mock NPC simulator as a product capability. Do not count the removed `npc-sim` package as implemented production IP.

**Important distinction:** this commit did **not** remove all NPC technology from the platform. Search on the current `Master` branch still finds the `spatial-platform/packages/ai-npc` package, NPC API routes, NPC panels/providers, and engine-level NPC simulation modules. The platform therefore still contains an NPC subsystem, but the standalone Studio simulator surface has been removed.

## 2. The remaining `spatial-platform` NPC brain is real provider-backed library code, but its runtime use is not proven

`spatial-platform/packages/ai-npc/package.json` defines a private workspace package `@spatial/ai-npc` with a TypeScript build. Its `src/index.ts` exports `LLMClient`, `NPCMemory`, `NPCBrain`, and `SpatialNPC`.

`spatial-platform/packages/ai-npc/src/brain.ts` defines `NPCBrain` with configurable personality, system prompt, knowledge base, memory size and interaction radius. It calls an `LLMClient`, retrieves relevant/recent memories, asks for structured JSON (`action`, `dialogue`, `emotion`, `confidence`), records observations, and supports direct player chat with memory updates.

`spatial-platform/packages/ai-npc/src/llm-client.ts` implements real HTTP chat-completion calls for OpenAI, Anthropic, Mistral and Groq, plus streaming support. Provider credentials are supplied to the client configuration rather than being hard-coded.

However, repository search for `@spatial/ai-npc` and `NPCBrain` only resolves to the package's own files; no consuming application import was found. The `spatial-platform/apps/api/src/routes/ai-npc.ts` route stores NPC configuration in PostgreSQL but does not import or instantiate `NPCBrain`.

**Status:** real, buildable library-level NPC reasoning code, but currently **unproven as an active runtime dependency**. It should not be counted as an end-to-end live NPC feature until a consumer/import and execution path are traced.

## 3. Spatial API has real WebSocket infrastructure, but it is currently multiplayer, not the live-NPC bridge

`spatial-platform/apps/api/package.json` includes `@fastify/websocket` and runtime `ws`. `spatial-platform/apps/api/src/index.ts` registers the WebSocket plugin and the multiplayer routes.

`spatial-platform/apps/api/src/routes/multiplayer.ts` implements `/ws/room/:worldId`, room state, participant tracking, join/state/update/chat/ping messages, broadcast, and disconnect cleanup.

This is important because it corrects a possible overstatement: the DreamMakerHub spatial API **does have real WebSocket infrastructure**, but the verified WebSocket route is for multiplayer rooms. No `/live-npc` route was found there.

## 4. Cross-repository live-NPC bridge is currently inconsistent

`dreammakerhub.website/apps/web/app/api/npc/live/route.ts` is an authenticated SSE bridge. It constructs a WebSocket URL from `NEXT_PUBLIC_WONDERPLAY_3D_URL` (defaulting to `https://wonderplay-3d.dreammakerhub.website`) and attempts to connect to `/live-npc?id={npcId}`. It then relays binary audio, viseme frames and dialogue events back to the authenticated dashboard.

The current `AI-WonderLand1/wonderplay-3D` `server.ts` exposes the verified Gemini REST endpoints (`/api/gemini/npc-intelligence`, `/api/gemini/npc-vision`, `/api/gemini/npc-video`), health and contact endpoints, but no server-side `/live-npc` listener is present in the inspected server or found by repository search. Its `package.json` includes `@types/ws` only as a development dependency and does not list the `ws` runtime package.

The client-side `wonderplay-3D/src/websocketBrain.ts` independently expects a server at `${serverUrl}/live-npc?id=${npcId}` and handles audio/viseme/dialogue messages, so the protocol is clearly designed—but the server endpoint that would satisfy it is not verified in the current WonderPlay repository.

**Additional implementation detail:** `src/websocketBrain.ts` currently supplies fixed viseme values (`jawOpen: 0.5`, `mouthFunnel: 0.1`, `mouthPucker: 0.2`) when binary audio arrives. This is not measured/generated viseme analysis.

**Status:** unresolved cross-repo dependency / likely integration blocker. The website can attempt the bridge, and the WonderPlay client can consume the protocol, but the current WonderPlay server source does not prove that the corresponding WebSocket server exists.

## 5. Additional security issue in the website live-NPC bridge

The website live-NPC route authenticates the caller with `requireUserId`, but the inspected route does not actually query NPC ownership before opening the remote WebSocket. Its comment says it relays only an NPC the caller owns/selects, but the code only validates that `npcId` is present. Ownership must be enforced against the NPC storage layer before proxying a live stream.

This is a **P0/P1 security item** if the route is exposed publicly: authentication alone is not the same as object-level authorization.

## 6. Spatial NPC CRUD itself has an authorization gap on reads

`spatial-platform/apps/api/src/routes/ai-npc.ts` requires JWT authentication for create/update/delete, and update/delete explicitly compare the NPC's `owner_id` to the authenticated user. However, the GET collection route is unauthenticated and returns either all NPCs for a supplied `worldId` or up to 50 NPC records; the GET-by-ID route is also unauthenticated.

That means the current spatial NPC API has stronger object-level authorization on writes than on reads. If NPC records contain private prompts, knowledge bases, model configuration, or other user-owned data, the read endpoints need ownership/world visibility rules.

## 7. AI-PLAYGROUND main branch has materially improved since the previous research run

The current `AI-WonderLand1/AI-PLAYGROUND` `main` branch includes commit `1fb7033a9edb04afca110e5a8775ecc90289788a`, which explicitly fixes several issues previously recorded as blockers:

- Stripe webhook mount was corrected to `/api/stripe/webhook`.
- `supabaseAdmin` proxy methods are now bound to the real client.
- Template visibility is enforced for unauthenticated reads.
- The template API rate limiter is mounted before the router.
- OpenRouter fallbacks have timeouts.
- Unknown `/api/*` paths return JSON 404s.
- Production exits non-zero on unhandled promise rejection.
- Cloudflare/Wrangler tooling was removed in favor of Railway.
- CI actions were upgraded to checkout/setup-node v7.

The current `server/index.ts` confirms restrictive origin handling using `ALLOWED_ORIGINS`, authenticated Wonderland-key checks for `/api/chat` and `/api/chat/stream`, rate limits of 60 chat requests/minute and 30 stream requests/minute, and the corrected Stripe webhook mount.

The current `server/stripe-webhook.ts` verifies Stripe signatures and writes subscription state to Supabase using the admin client. The current `server/supabase-admin.ts` no longer falls back to an anon key and correctly binds client methods.

**Status change:** several prior AI-PLAYGROUND security/Stripe findings should be marked **fixed on `main`**, not still open.

## 8. AI-PLAYGROUND still has explicit unresolved production items

The repository's current `notes/todo.md` records:

- Replicate/Hugging Face providers are still stubs.
- Browser/localStorage provider keys in `src/utils/nodeExec.ts` still need a backend/security decision.
- Bundle size remains a concern (single ~2 MB chunk).
- `AIWonderCanvas.tsx` remains a very large ~6,125-line component.

The same file states that local typecheck/build verification passes and that the deployment target is Railway. It also notes that the working copy tracks `feature/workflow-templates` and that deployment only receives those branch-specific changes after synchronization.

A branch comparison confirms `feature/workflow-templates` and `main` have diverged: `main` is 5 commits ahead while `feature/workflow-templates` is 4 commits ahead of their merge base. Therefore the workflow-template work is **not a simple fast-forward** and needs an explicit merge/rebase decision before it can be treated as the single canonical deployment state.

## 9. AI-PLAYGROUND security process is now documented

`SECURITY.md` now directs vulnerability reports through GitHub private vulnerability reporting and states that only the latest `main` branch receives security updates. This is a positive production-readiness improvement, but it does not itself resolve the remaining client-side provider-key concern.

## 10. WonderPlay-3D current server remains REST-oriented despite an internal WebSocket client

The current `wonderplay-3D/package.json` identifies the project as `custom-npc-orchestration-engine`, with Three.js, glTF Transform, Gemini SDK and Express dependencies. The server implements real Gemini-backed tactical reasoning, image perception and video reconnaissance with structured JSON output.

The current `src/index.ts` exports a `CustomNPCEngine` that creates a `WebsocketBrain`, compiles smart NPC GLBs, manages dialogue/voice/visemes, and emits NPC events. `src/websocketBrain.ts` creates a browser WebSocket connection to `/live-npc`, consumes binary audio and viseme frames, and sends player input.

`src/gltfCompiler.ts` also contains real glTF processing: it reads a binary GLB with glTF Transform, embeds `engineTarget`, NPC identity/behavior/voice/initial state, voice profile and dialogue into glTF extras, and writes the resulting GLB back out.

But no corresponding server-side `/live-npc` listener was verified in the current `server.ts` or by repository search, and `ws` is not a runtime dependency in the WonderPlay server package. This strengthens the conclusion that the **NPC protocol/client and asset-compilation architecture exists, while the server-side live transport is not currently proven end-to-end**.

## 11. Commercial/IP implication

The deletion of the standalone `npc-sim` package is commercially useful because it removes a large amount of mock/demo code from the product surface. Sponsorship and customer materials should not cite that deleted package as evidence of production NPC simulation.

The defensible current claim is narrower: DreamMakerHub contains real NPC-related storage/API/library code, WonderPlay contains real NPC asset compilation plus dialogue/voice/event/client runtime pieces and provider-backed Gemini tools, and the spatial API contains real multiplayer WebSocket infrastructure. However, the public live-NPC bridge requires an end-to-end transport, ownership, and runtime-instantiation pass before it should be marketed as a finished live service.

## Next unresolved dependency to investigate

1. Prove or disprove the intended WonderPlay `/live-npc` server implementation and identify the actual runtime host.
2. Trace `spatial-platform/packages/ai-npc` from package entrypoint to a consuming application import; if no consumer exists, classify it as an unused library rather than a production runtime.
3. Add/verify object-level ownership enforcement in `apps/web/app/api/npc/live/route.ts`.
4. Tighten unauthenticated NPC GET routes in `spatial-platform/apps/api/src/routes/ai-npc.ts`.
5. Reconcile `AI-PLAYGROUND` `main` versus `feature/workflow-templates` and determine which branch is intended for Railway deployment.
6. Re-run the billing/entitlement trace after the newer AI-PLAYGROUND Stripe fixes so previously reported blockers are not carried forward incorrectly.
