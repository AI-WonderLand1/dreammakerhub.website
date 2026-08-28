# DreamMakerHub Deep-Dive Addendum — 2026-08-28

## Executive update

Today’s trace materially changes the repository map and corrects one prior finding. The former `wonderplay-3D` project has been renamed/moved to `AI-WonderLand1/NPC-AI-SIM`, and DreamMakerHub now points its 3D/NPC references at that repository. The connected GitHub installation also now exposes `AI-WonderLand1/AI-PLAYGROUND` directly, allowing fresh source-level inspection.

## 1. Repository rename is real and affects cross-repo contracts

Commit `fb4f7a5862a01a623b1b712af5d505075c5baece` changes DreamMakerHub references from WonderPlay 3D to `npc-ai-sim` and points the intended repository at `AI-WonderLand1/NPC-AI-SIM.git`. The same commit changes the dashboard labels, project-type labels, voice-command help, and NPC Live Feed copy. The NPC-AI-SIM repository itself was renamed through commits `ef3bdaf`, `644c1b8`, and `57383e4`.

This is more than a cosmetic rename: the integration target/domain and product naming have changed. Any remaining `wonderplay-3D` URL, package, documentation, deployment, or environment variable must be rechecked.

## 2. NPC-AI-SIM is now directly inspectable

Current `main` tree contains a TypeScript/React app, Express server, Gemini integration, GLTF tooling, PlayCanvas, Three.js, Supabase packages, builder components, NPC dialogue/voice/animation systems, and a WebSocket implementation. `package.json` is named `custom-npc-orchestration-engine` and describes a universal web-native AI-NPC pipeline.

However, its subscription layer remains demo-grade: `SubscriptionContext.tsx` calls `/api/subscriptions/create` and `/api/subscriptions/check`, while the server stores subscriptions in an in-memory JavaScript object keyed by email and accepts the requested tier from the request body. This is not durable billing, not Stripe, and not suitable for commercial entitlement.

The repository also has no declared license in GitHub metadata. That must remain part of the IP audit.

## 3. Live NPC bridge is still not proven end-to-end

DreamMakerHub’s current `/api/npc/live` route is a real authenticated SSE bridge. It builds a WebSocket URL from `NEXT_PUBLIC_WONDERPLAY_3D_URL`, defaulting to `https://npc-ai-sim.dreammakerhub.website`, then opens `/live-npc?id=...` and relays binary audio, viseme frames, dialogue, and status events back to the browser.

But the current NPC-AI-SIM server source still contains a `WebSocketServer({ noServer: true })` and connection handlers, while the package manifest does not list the `ws` runtime dependency—only `@types/ws`. The inspected source does not yet prove the HTTP server’s upgrade event is connected to `wss.handleUpgrade`. Therefore the public live-NPC path remains an unresolved runtime/deployment dependency.

There is also an authorization gap to re-check: DreamMakerHub authenticates the caller but the route does not visibly query ownership of the requested `npcId` before opening the engine connection.

## 4. Important correction: build persistence was previously misclassified

The current `Master` branch’s `engine/core/ai/bridge.ts` is NOT a no-op. It performs a real filesystem write with `writeFileSync`, creates the blocks directory, injects the confession comment, validates code with `SecurityCore.validateCodeSafety`, and returns a real `path` when successful.

The `/api/build/stream` route is still stale (last modified July 21) and does call `manifestVisualBlock()` and read `result.path`, so the persistence contract itself is valid. The remaining issue is that the route reports `Saved to blocks/ ✓` regardless of whether the bridge returns `blocked` or `error`; it also uses a filesystem path inside the repository, which is not automatically durable in a serverless/container deployment. This finding replaces the earlier “manifestVisualBlock is a no-op” claim.

## 5. DreamMakerHub package state changed materially

The current root `package.json` (modified August 27) contains `ws` as a production dependency, `uuid` 14, Next 16.2.x, React 19.2.x, PlayCanvas, Gaussian Splatting, WebContainer, Coder/Kubernetes, Stripe, Supabase, Colyseus, and the WonderSpace IDE package. It also has a workspace monorepo and security-focused dependency overrides.

The recent commit sequence includes fixes for malformed package.json syntax, Docker/Node version skew, error-handler parsing, workflow branch references, and merge-conflict cleanup. This means several earlier “manifest may be malformed” concerns should be downgraded; current runtime/build verification is still required.

## 6. AI-PLAYGROUND is now directly available and its current architecture is healthy in key areas

Current `main` is at commit `8509c6b9` after workflow-template/library cleanup. Its server has:
- Express API
- explicit CORS origin handling
- separate rate limits for templates, chat, and streaming
- Wonderland-key validation before model calls
- Stripe webhook mounting with raw-body handling
- real provider routing and streaming
- JSON API 404 handling
- health endpoint

Its provider registry has real request/response adapters for OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together AI, Fireworks, DeepSeek, Perplexity, xAI, and Google Gemini. Replicate and Hugging Face remain explicit stubs whose request builders return `{}` and whose response parsers return an empty-response placeholder.

The repo has a Security policy and recent workflow/template cleanup. This is a meaningful upgrade over the previous inability to inspect the repository directly.

## 7. AI-PLAYGROUND still needs contract tracing into DreamMakerHub

The AI-PLAYGROUND server expects a `wonderlandKey` in the request body for `/api/chat` and `/api/chat/stream`. DreamMakerHub’s internal model routing has its own provider registry and Supabase/Stripe entitlement model. No current source evidence establishes that DreamMakerHub’s user/session entitlement is exchanged for a valid Wonderland key automatically.

This is now the next cross-repository AI contract to trace: DreamMakerHub authenticated user -> key issuance/validation -> AI-PLAYGROUND -> provider -> usage/billing attribution.

## 8. Commercial status

The sponsorship program remains published but not proven payable through a dedicated tier-aware sponsor checkout. The newly verified repository rename means sponsor material should also use the current NPC-AI-SIM name where appropriate and avoid stale WonderPlay 3D references.

## Priority changes

### Downgrade / correct
- Remove the claim that `manifestVisualBlock` is a no-op. It is a real filesystem-writing implementation.
- Downgrade prior root-package JSON syntax concern because the current package file is valid-looking and recent commits explicitly repaired syntax; runtime build still needs verification.

### New P0/P1 items
1. Verify live NPC WebSocket upgrade handling and `ws` runtime dependency in NPC-AI-SIM deployment.
2. Verify `npcId` ownership before the DreamMakerHub live bridge connects.
3. Reconcile all stale WonderPlay 3D names/URLs/env vars after rename to NPC-AI-SIM.
4. Trace DreamMakerHub -> Wonderland key -> AI-PLAYGROUND end-to-end.
5. Separate demo subscription state in NPC-AI-SIM from the canonical DreamMakerHub Stripe entitlement system.
6. Confirm filesystem persistence semantics of the Builder in the actual deployment environment.
7. Keep the licensing/SBOM audit open across all three repositories.

## Evidence links

- DreamMakerHub rename commit: `fb4f7a5862a01a623b1b712af5d505075c5baece`
- NPC-AI-SIM current head: `57383e4878f91a54e18b4eeed55d271669ed2eec`
- AI-PLAYGROUND current head: `8509c6b9b2b29d1a973eb5f00c92409e4581f37f`
