# 3D Engine System — One Engine at a Time

## RULE: Single Active Engine

Only ONE engine may render at any time. Before loading a new engine:
1. Stop the current engine's RAF loop
2. Destroy its canvas context
3. Null the active reference
4. Then load the new engine

---

## Phase 1: EngineManager (Kernel Foundation)

Build the kernel-level engine manager that enforces the single active engine rule.

- [ ] Create `engine/core/runtime/types.ts` — interfaces (EngineConfig, ActiveEngine, EngineManager)
- [ ] Create `engine/core/runtime/engine-manager.ts` — singleton:
  - `loadEngine(name, config)` — dispose current, load new, start single RAF loop
  - `dispose()` — stop RAF, destroy context, null active
  - `getActiveEngine()` — returns active engine name or null
  - Guard: reject if another engine is initializing
- [ ] Create `engine/core/runtime/canvas-tracker.ts` — warn if >1 canvas context exists
- [ ] Create `engine/core/runtime/index.ts` — public API
- [ ] Test: load playcanvas, verify single RAF loop, switch to webgl, verify playcanvas disposed

---

## Phase 2: PlayCanvas Engine (First Working Engine)

Get PlayCanvas rendering properly through the EngineManager.

### 2A. PlayCanvas Adapter
- [ ] Create `engine/core/adapters/playcanvas/types.ts`
- [ ] Create `engine/core/adapters/playcanvas/adapter.ts`:
  - `create(config)` — returns { canvas, app, destroy, onFrame }
  - `destroy()` — calls app.destroy(), loses WebGL context
- [ ] Create `engine/core/adapters/playcanvas/index.ts`

### 2B. Refactor PlayCanvasViewer
- [ ] Modify `apps/web/components/engines/PlayCanvasViewer.tsx`:
  - Remove direct `new pc.Application(canvas)` creation
  - Use `engineManager.loadEngine('playcanvas', ...)` instead
  - Delegate RAF loop to EngineManager
  - Expose `destroy()` that calls `engineManager.dispose()`
- [ ] Verify: viewer renders, orbit controls work, cleanup runs on unmount

### 2C. Wire into QuadEngineShell
- [ ] Modify `apps/web/components/QuadEngineShell.tsx`:
  - `handleEngineSwitch` calls `engineManager.dispose()` then `engineManager.loadEngine()`
  - Await disposal before loading new engine
- [ ] Test: switch from PlayCanvas → WebGL → back, verify no leaked contexts

### 2D. Verify PlayCanvas End-to-End
- [ ] Navigate to QuadEngineShell, PlayCanvas tab loads
- [ ] 3D viewport renders (cube, ground, lighting)
- [ ] Mouse orbit controls work
- [ ] Switch to WebGL tab → PlayCanvas fully disposed
- [ ] Switch back → PlayCanvas re-initializes cleanly
- [ ] No console errors about leaked contexts

---

## Phase 3: WebGL Studio Engine (Second Working Engine)

Get actual WebGL shader rendering working.

### 3A. WebGL Adapter
- [ ] Create `engine/core/adapters/webgl/types.ts`
- [ ] Create `engine/core/adapters/webgl/adapter.ts`:
  - `create(config)` — creates canvas, gets WebGL2 context, sets up shader compiler
  - `destroy()` — loses context, removes canvas
  - `compileShader(source)` — compiles GLSL, returns program
  - `render()` — runs the shader render loop
- [ ] Create `engine/core/adapters/webgl/index.ts`

### 3B. Build Real WebGLStudioViewer
- [ ] Create `apps/web/components/engines/WebGLStudioViewer.tsx`:
  - Canvas element for WebGL rendering
  - Uses `engineManager.loadEngine('webgl', ...)` 
  - Accepts shader source, compiles and renders
  - Supports uniforms (time, resolution, mouse)
  - Cleanup via `engineManager.dispose()`
- [ ] Implement basic quad renderer (fullscreen triangle with fragment shader)

### 3C. Refactor WebGLStudioEngine
- [ ] Modify `apps/web/components/engines/WebGLStudioEngine.tsx`:
  - Replace pure-UI with real WebGLStudioViewer integration
  - Shader templates → actual compilable GLSL
  - "Apply & Preview" → compiles shader and renders
  - Keep sidebar tools as UI controls that affect the shader
- [ ] Verify: select shader template, click apply, see rendered output

### 3D. Wire into EngineManager
- [ ] Modify `QuadEngineShell.tsx` — WebGL tab uses EngineManager
- [ ] Test: PlayCanvas → WebGL switch, verify PlayCanvas disposed
- [ ] Test: WebGL → PlGL → PlayCanvas switch, verify WebGL disposed

### 3E. Verify WebGL End-to-End
- [ ] Navigate to WebGL tab, canvas renders
- [ ] Shader templates compile and display
- [ ] Shader editor textarea modifies output in real-time
- [ ] Switch to PlayCanvas → WebGL fully disposed
- [ ] Switch back → WebGL re-initializes cleanly
- [ ] No leaked contexts or RAF loops

---

## Phase 4: Puck UI Engine (Third Working Editor)

Get actual Puck drag-and-drop editor working.

### 4A. Refactor PuckUIEngine
- [ ] Modify `apps/web/components/engines/PuckUIEngine.tsx`:
  - Import `@puckeditor/core` (already in dependencies)
  - Create actual Puck editor instance with component config
  - Wire component library sidebar to Puck's component registry
  - Handle drag-and-drop from sidebar to canvas
- [ ] Define Puck components matching the existing UI_COMPONENTS list:
  - Button, Input, Card, Modal, etc.
  - Each with proper fields and render functions

### 4B. Wire into EngineManager
- [ ] Puck doesn't need WebGL, but still register as an engine
- [ ] `engineManager.loadEngine('puck', ...)` — creates Puck instance
- [ ] `engineManager.dispose()` — destroys Puck instance
- [ ] Test: switch between Puck ↔ PlayCanvas, verify cleanup

### 4C. Verify Puck End-to-End
- [ ] Navigate to Puck tab, editor renders
- [ ] Drag component from sidebar onto canvas
- [ ] Component appears in editor
- [ ] Edit component props in sidebar
- [ ] Switch to PlayCanvas → Puck disposed
- [ ] Switch back → Puck re-initializes

---

## Phase 5: Engine Switching Integration Tests

Test all engine switches work without leaks.

- [ ] PlayCanvas → WebGL → PlayCanvas (no context leak)
- [ ] PlayCanvas → Puck → PlayCanvas (no memory leak)
- [ ] WebGL → Puck → WebGL (clean transitions)
- [ ] Rapid switching (5x fast toggle) — stable
- [ ] Verify single RAF loop always (never 2 loops running)
- [ ] Verify canvas tracker warns on multiple contexts
- [ ] Verify memory stays stable across 10 switches

---

## Phase 6: Polish & Hardening

- [ ] Add loading states during engine init
- [ ] Add error boundaries per engine
- [ ] Add engine status indicator in footer
- [ ] Add keyboard shortcut: Ctrl+1/2/3 to switch engines
- [ ] Add "Reset Engine" button that disposes + re-creates
- [ ] Log engine lifecycle events to console (dev mode)
- [ ] Update STRUCTURE.txt with engine/runtime paths

---

## File Map

```
engine/core/runtime/
  types.ts              — EngineManager interfaces
  engine-manager.ts     — Singleton enforcing single active engine
  canvas-tracker.ts     — Canvas context tracking
  index.ts              — Public API

engine/core/adapters/
  playcanvas/
    types.ts
    adapter.ts
    index.ts
  webgl/
    types.ts
    adapter.ts
    index.ts

apps/web/components/engines/
  PlayCanvasEngine.tsx    — Modified (uses EngineManager)
  PlayCanvasViewer.tsx    — Modified (delegates to EngineManager)
  WebGLStudioEngine.tsx   — Modified (real WebGL rendering)
  WebGLStudioViewer.tsx   — NEW (WebGL canvas renderer)
  PuckUIEngine.tsx        — Modified (real Puck editor)
  WebGPUengine.tsx        — Future phase (not in this scope)

apps/web/components/
  QuadEngineShell.tsx     — Modified (EngineManager switching)
```

---

## Execution Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
  ↑           ↑           ↑           ↑
  Kernel    PlayCanvas    WebGL       Puck
  first     working       working     working
```

Each phase must be verified working before starting the next.
