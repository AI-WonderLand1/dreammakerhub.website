# TODO - Wonderspace Engine & NPC Pipeline

## 🔥 High Priority

### 1. Replace Convai NPC with Your AI Stack
- [ ] Modify `apps/web/lib/ai/convaiNpcProvider.ts`
  - Remove Convai API calls
  - Use `openCodeProvider` (model: `opencode/big-pickle`) or `openrouterProvider` (Gemini 2.5 Flash)
  - Pull Mem0 memories from Supabase into prompt context
  - Return same shape: `{ text, timestamp }`

- [ ] Optional: Simplify or remove `apps/web/app/api/convai/chat/route.ts`
  - Or repurpose for your own AI proxy

### 2. Add ElevenLabs TTS (Users Bring Their Own Key)
- [x] Create `apps/web/app/api/npc/tts/route.ts` — DONE (route exists)
- [ ] Wire TTS into UI (call endpoint from frontend)

### 3. Optimize glTF Files (Save Supabase Storage/Memory)
- [x] Ensure `packages/optimizer/` is deployed and working — DONE
- [x] Create `apps/web/app/api/assets/process/route.ts` — DONE (route exists)
- [ ] Wire into upload flow (`lib/ai/assetLibrary.ts`)
  - Auto-optimize on upload
  - Store optimized version in Supabase

## 🔶 Medium Priority

### 4. Lip-Sync + glTF Morph Targets
- [ ] Generate viseme data from text (simple phoneme → mouth shape mapping)
- [ ] Ensure glTF models have morph targets using `@gltf-transform/functions`
  - `mouthOpen`, `jawOpen`, etc.
- [ ] Extend `apps/web/public/playcanvas/theatre-bridge.js` to read viseme data
- [ ] PlayCanvas reads viseme data and morphs face

### 5. On-Demand Scene Creation (No Batch!)
- [ ] User selects character + scene from templates
- [ ] Click "Create My Game/Movie"
  - `POST /api/environments` → K8s pod spins up with SSH key
  - `POST /api/assets/process` → optimize character + scene
  - Optional: `POST /api/scenes/merge` → combine using `merge()` from `@gltf-transform/functions`
  - Redirect to `https://{workspaceId}.dreammakerhub.website`


## 🔹 Low Priority

### 7. Character & Scene Management
- [ ] Allow users to upload their own glTF models
- [ ] AI-generated characters using your AI SDK
- [ ] Scene merging for large worlds (split into chunks for streaming)

### 8. Output Types
- [ ] Games (interactive, PlayCanvas runtime)
- [ ] Movies/Videos (pre-rendered, export as MP4)
- [ ] Both?

## 🏗️ Builders & 3D/Spatial Surfaces

### 6. Builder Page Consolidation
- [ ] Audit all builder entry points (`/builder`, `/builder-ai`, `/builder/3d`, `/wonder-build/*`)
- [ ] Define clear routing strategy: marketing funnel → workspace → editor
- [ ] Unify auth/session handling across builder surfaces

### 7. WebGL Studio (`/builder/3d`)
- [ ] Replace dynamic import with proper client component boundary
- [ ] Add Supabase Drive integration (replace LiteFileSystem)
- [ ] Connect asset library (`lib/ai/assetLibrary.ts`) to WebGL Studio
- [ ] Add scene save/load via Supabase Storage
- [ ] Implement collaborative editing (Yjs / CRDT)

### 8. PlayCanvas Editor (`/wonder-build/playcanvas`)
- [ ] Fix embed timeout — investigate iframe sandbox restrictions
- [ ] Add glTF drag-drop import from Asset Library
- [ ] Wire auto-save to Supabase (already has `useAutoSave`)
- [ ] Add NPC panel memory persistence across sessions
- [ ] Implement scene forking/versioning

### 9. AI Builder (`/wonder-build/ai-builder`)
- [ ] Extend `3d-assets` type to output PlayCanvas-ready scenes
- [ ] Integrate `packages/optimizer/` for generated 3D assets
- [ ] Add "Open in PlayCanvas" action on build complete
- [ ] Support iterative refinement (chat → modify scene)

### 10. Puck Visual Builder (`/wonder-build/puck`)
- [ ] Add 3D block types (`ThreeCanvasWrapperBlock` exists)
- [ ] Connect to `assetLibrary` for 3D model insertion
- [ ] Export to PlayCanvas scene format
- [ ] Add collaborative editing (multi-user cursors)

### 11. Spatial Designer (External: `spatial.dreammakerhub.website`)
- [ ] Decide: integrate into monorepo or keep external?
- [ ] If integrating: migrate to `/wonder-build/spatial`
- [ ] Add real-time collab (WebRTC / WebSocket)
- [ ] Connect to Supabase for persistence
- [ ] Unified auth with main app

## ❌ Don't Touch
- ✅ PlayCanvas.com (ignore completely)
- ✅ Your K8s pod architecture (it's solid)
- ✅ SSH key system (ensures privacy)
- ✅ `direct-bootstrap.js` (your custom PlayCanvas loader)
- ✅ `packages/optimizer/` (already working)

## 📋 Current Architecture (Working)
| Component | Status | Path |
|---|---|---|
| K8s Pod per User | ✅ Working | `lib/workspace/provisioner.ts` |
| SSH Key Generation | ✅ Working | Auto-generates RSA 4096 |
| glTF Optimization | ✅ Working | `packages/optimizer/` |
| AI SDK (OpenCode, OpenRouter) | ✅ Working | `engine/core/ai/providers/` |
| Mem0 Memory (Supabase) | ✅ Working | `lib/ai/mem0Client.ts` |
| PlayCanvas Custom Loader | ✅ Working | `lib/playcanvasBootstrap.ts` |
| NPC Panel (Feature-flagged) | ✅ Working | `components/SafeNpcPanel.tsx` |

## 🤔 Questions
1. **ElevenLabs**: Users bring own key (like SSH keys) or shared key from Oracle Vault?
2. **Lip-sync**: Generate simple viseme JSON from text, use ElevenLabs visemes, or skip for now?
3. **Character + Scene**: Process on-demand when user enters editor or pre-process before redirect?
4. **Output**: Games, movies, or both?
