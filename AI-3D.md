## AI WONDERLAND 3D — TODO

### 1. Keep current 3D Asset AI
- [ ] Keep `/dashboard/ai-generator` as the main 3D Asset AI
- [ ] Confirm Text → 3D works
- [ ] Confirm Image → 3D works
- [ ] Confirm textures/material generation works
- [ ] Confirm generated GLB assets save to the user asset library
- [ ] Remove/replace any old demo-only 3D AI pages that duplicate this functionality
- [ ] Point `3d-ai.dreammakerhub.website` to the real AI WONDERLAND 3D experience

### 2. Use Qwen as the assistant/brain
- [ ] Keep existing Qwen2.5-Coder model
- [ ] Use Qwen for guidance, scripting, tool calls, and project assistance
- [ ] Do **not** make Qwen generate meshes directly
- [ ] Give Qwen safe tools for:
  - [ ] add/remove scene object
  - [ ] move/rotate/scale
  - [ ] add collider
  - [ ] add rigid body
  - [ ] configure lighting
  - [ ] configure camera
  - [ ] configure FPV
  - [ ] configure controller/gamepad
  - [ ] attach NPC
  - [ ] generate PlayCanvas script
  - [ ] optimize GLB
  - [ ] validate scene
- [ ] Add “Apply suggestion” instead of silently changing the whole project

### 3. Add open-source 3D generation backend
- [ ] Evaluate TRELLIS/TRELLIS.2 as the main open-source 3D generator
- [ ] Verify license/dependencies before production use
- [ ] Add model adapter interface so the 3D generator can be replaced later
- [ ] Support BYOC/user GPU where possible
- [ ] Avoid requiring paid generation APIs for the base product
- [ ] Add job status/progress handling
- [ ] Save completed output to user library

### 4. Build one main 3D canvas/editor workflow
Layout:

```text
LEFT              CENTER              RIGHT
Assets/NPCs       3D Canvas           Inspector
Scenes                                Properties

                     +
                AI Assistant
```

- [ ] Asset library panel
- [ ] NPC library panel
- [ ] Scene hierarchy
- [ ] Drag/drop assets into scene
- [ ] Drag/drop NPCs into scene
- [ ] Move/rotate/scale gizmos
- [ ] Material controls
- [ ] Lighting controls
- [ ] Physics controls
- [ ] Camera controls
- [ ] Animation controls
- [ ] Script/interaction controls
- [ ] Preview/play mode

### 5. NPC-AI-SIM integration
NPCs remain **user-created reusable creations**.

- [ ] Save NPC definitions independently from scenes
- [ ] Show saved NPCs in NPC library
- [ ] Drag NPC from library into PlayCanvas scene
- [ ] Place the NPC model at drop position
- [ ] Keep a reference to original `npcId`
- [ ] Store per-scene NPC instance settings
- [ ] Add in-canvas NPC Inspector
- [ ] Allow:
  - [ ] Edit this instance
  - [ ] Edit base NPC
- [ ] Instance overrides for:
  - [ ] position
  - [ ] health/stats
  - [ ] animations
  - [ ] faction
  - [ ] inventory
  - [ ] behavior
  - [ ] dialogue/context
  - [ ] interaction radius
- [ ] “Open Full NPC-AI-SIM” button
- [ ] Connect runtime personality/memory/voice/behavior when game runs

### 6. FPV and controller support
- [ ] First-person controller
- [ ] WASD + mouse
- [ ] jump
- [ ] sprint
- [ ] crouch
- [ ] interaction button
- [ ] camera FOV
- [ ] camera sensitivity
- [ ] camera smoothing
- [ ] collision
- [ ] Xbox controller
- [ ] PlayStation controller
- [ ] generic browser Gamepad API
- [ ] controller deadzone
- [ ] remappable controls
- [ ] mobile/touch controls later

### 7. Scene generation
AI should generate a **starting scene**, not permanently take over editing.

Example:

```text
"Create a small medieval village"
```

- [ ] Qwen interprets request
- [ ] Uses existing user assets first where appropriate
- [ ] Requests missing assets from 3D Asset AI
- [ ] Places assets
- [ ] Adds basic lights
- [ ] Adds camera
- [ ] Adds physics defaults
- [ ] Adds FPV/controller setup if requested
- [ ] Returns editable scene to user
- [ ] User makes all final changes in canvas

### 8. AI assistant behavior
The assistant should primarily **guide and assist**.

- [ ] Inspect selected object
- [ ] Explain settings
- [ ] Suggest fixes
- [ ] Generate scripts
- [ ] Generate assets on request
- [ ] Generate scene draft on request
- [ ] Configure controller on request
- [ ] Help wire NPCs
- [ ] Optimize scene on request
- [ ] Diagnose errors
- [ ] Never continuously rebuild user scene without explicit action

### 9. Cost controls
- [ ] Normal canvas edits use **zero AI inference**
- [ ] Moving objects uses zero AI
- [ ] Physics simulation uses engine, not LLM
- [ ] Controller input uses engine, not LLM
- [ ] NPC movement/game state uses runtime logic where possible
- [ ] AI only called when user requests generation/help
- [ ] Cache generated assets
- [ ] Reuse user assets before generating new ones
- [ ] Put limits on generation jobs
- [ ] Support user-owned compute/API/GPU later

### 10. Shared project structure
Use one structured project state:

```text
WorldProject
├── assets
├── scene
├── entities
├── npcInstances
├── lights
├── cameras
├── physics
├── animations
├── controls
├── scripts
└── publishConfig
```

- [ ] Keep asset IDs stable
- [ ] Keep NPC IDs stable
- [ ] Save scene edits automatically
- [ ] Version scene state
- [ ] Add undo/redo
- [ ] Prevent AI tool calls from overwriting unrelated data

### 11. Validation/optimization
- [ ] GLB validation
- [ ] missing texture checks
- [ ] broken asset reference checks
- [ ] polygon budget warnings
- [ ] texture-size warnings
- [ ] collider checks
- [ ] script error checks
- [ ] controller binding conflict checks
- [ ] NPC reference checks
- [ ] browser performance check
- [ ] one-click optimize for web

### 12. Publish
- [ ] Save final editable project
- [ ] Build playable output
- [ ] Include NPC runtime bindings
- [ ] Include controls
- [ ] Include assets/textures
- [ ] Include scene scripts
- [ ] Run validation before publish
- [ ] Production publish remains separate from normal editing

## First implementation order

```text
1. Fix real 3D AI route/subdomain
2. Finish Asset AI → user library
3. Add Qwen tool interface
4. Build unified 3D canvas
5. Add drag/drop assets
6. Add drag/drop NPCs
7. Add NPC instance inspector
8. Add FPV
9. Add gamepad/controller
10. Add AI-assisted scene generation
11. Add validation/optimization
12. Publish
```

That keeps the first version manageable: **AI generates and assists; PlayCanvas runs the world; the user controls the actual editing.**
