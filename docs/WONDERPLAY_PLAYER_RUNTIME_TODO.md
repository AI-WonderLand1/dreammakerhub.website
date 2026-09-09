# WonderPlay FPV / Game Play Runtime TODO

## Purpose

Build the **human-controlled game runtime and Play/Test mode** for WonderPlay without creating another product or repo.

This system belongs in the main `dreammakerhub.website` repository because WonderPlay/3D, PlayCanvas/WebGL, project identity, workspace identity, dashboard orchestration, assets and publishing already live there.

The goal is to let a user build a game scene, connect game logic, attach NPC brains, choose a player style, press **Play**, and immediately interact with the finished scene in the browser.

## Locked product ownership

```text
dreammakerhub.website / WonderPlay
  WORLD + PLAYER + GAME RUNTIME

AI-PLAYGROUND
  VISUAL GAME LOGIC AUTHORING

NPC-AI-SIM
  AUTONOMOUS NPC BRAIN / COGNITION

Dashboard in dreammakerhub.website
  PROJECT / WORKSPACE COMMAND CENTER + REAL-TIME STATUS

Vanguard Engine
  FUTURE PRODUCT - DO NOT MOVE THIS WORK THERE NOW
```

### WonderPlay / main repo owns

- browser game scene/runtime
- PlayCanvas/WebGL rendering
- FPV/TPV/top-down player controllers
- camera/input
- collision/physics integration
- interaction raycasts and trigger volumes
- player animation state
- interactable world objects
- game-state execution
- local real-time gameplay logic execution
- Play/Test mode
- multiplayer authority boundary
- scene/entity IDs
- integration bridge to AI Playground logic
- integration bridge to NPC-AI-SIM
- publishing/package validation

### AI Playground owns

- visual game-logic graph authoring
- trigger nodes
- condition nodes
- action nodes
- variables/state nodes
- reusable logic graphs
- external/slow automation where appropriate

AI Playground does **not** own camera movement, physics, WASD, frame-by-frame gameplay or the authoritative WonderPlay world runtime.

### NPC-AI-SIM owns

- NPC identity and brain configuration
- reasoning
- memory
- perception
- personality
- voice/dialogue
- NPC capabilities/actions
- training/skills
- NPC action selection

NPC-AI-SIM does **not** own the human player's controller or scene construction.

---

# Core user experience

Keep the workflow short.

```text
BUILD WORLD
   ↓
ATTACH LOGIC / NPC BRAINS
   ↓
PLAY TEST
   ↓
EDIT / REFINE
   ↓
PUBLISH
```

Inside WonderPlay, prefer **modes in the same project experience** instead of a maze of pages:

```text
BUILD | LOGIC | PLAY | PUBLISH
```

- **BUILD** = WonderPlay scene/asset editor
- **LOGIC** = opens the existing AI Playground game-logic experience with project/entity context
- **PLAY** = actual playable runtime
- **PUBLISH** = validation + packaging/deploy

Do not rebuild the AI Playground node editor inside WonderPlay just to make it appear integrated. Preserve repo boundaries and pass shared project context.

---

# Phase 1 - Player runtime contracts

Create engine-neutral interfaces first so later genre/player modes do not become unrelated hard-coded controllers.

- [ ] define `PlayerController` contract
- [ ] define `PlayerInputState`
- [ ] define `PlayerCameraState`
- [ ] define `PlayerMovementState`
- [ ] define `PlayerInteractionState`
- [ ] define `PlayerRuntimeEvent`
- [ ] define stable `entity_id` references
- [ ] define stable `scene_id` references
- [ ] carry `workspace_id` + `project_id` through runtime context
- [ ] keep rendering and immediate player movement browser-local
- [ ] do not require a cloud GPU for normal gameplay

Example conceptual boundary:

```text
Input
  ↓
PlayerController
  ↓
Movement / Camera / Interaction
  ↓
WonderPlay World
  ↓
Meaningful Runtime Events
```

---

# Phase 2 - FPV controller

## Required first-person controls

- [ ] Pointer Lock API mouse capture
- [ ] mouse look
- [ ] configurable sensitivity
- [ ] yaw rotation
- [ ] pitch rotation with clamp
- [ ] WASD movement
- [ ] walk speed
- [ ] sprint
- [ ] jump
- [ ] crouch
- [ ] gravity
- [ ] grounded state
- [ ] collision handling
- [ ] configurable FOV
- [ ] pause/input release on Escape
- [ ] input rebinding
- [ ] gamepad support after keyboard/mouse is stable

## FPV presentation

- [ ] optional first-person hands/arms
- [ ] first-person interaction animation hook
- [ ] camera recoil hook
- [ ] head/camera bob optional and disable-able
- [ ] damage feedback hook
- [ ] crosshair/interaction reticle

## Browser requirements

- [ ] WebGL2 path works
- [ ] WebGPU path may be added where supported
- [ ] graceful fallback on weak devices
- [ ] adaptive quality tiers
- [ ] browser/GPU owns frame rendering
- [ ] low-end hardware test pass

---

# Phase 3 - Additional player styles / genre presets

Do not create a separate editor for each genre. Genre selection should install a **runtime preset** and immediately open the same WonderPlay editor.

## Starter presets

- [ ] Blank game
- [ ] FPS
- [ ] First-person RPG
- [ ] Third-person action
- [ ] Top-down action RPG

## FPS preset

Installs/configures:

- [ ] FPV camera
- [ ] pointer lock
- [ ] WASD
- [ ] sprint
- [ ] jump
- [ ] player capsule/collider
- [ ] interaction ray
- [ ] optional weapon socket

## First-person RPG preset

Installs/configures:

- [ ] FPV base controller
- [ ] interact prompt
- [ ] pickup/use interaction
- [ ] inventory hooks
- [ ] dialogue interaction hook

## Third-person preset

- [ ] third-person follow camera
- [ ] orbit/look controls
- [ ] avatar locomotion bindings
- [ ] camera collision

## Top-down preset

- [ ] overhead/isometric camera
- [ ] visible pointer
- [ ] click/tap ground raycast
- [ ] click-to-move
- [ ] navigation/path request
- [ ] rotate character toward movement/action target

Genre presets must remain editable after creation. They are defaults, not permanent project restrictions.

---

# Phase 4 - Interaction runtime

Implement one reusable interaction system instead of hard-coding every gameplay object.

```text
Player camera/body
      ↓
interaction query
(ray / overlap / proximity)
      ↓
Interactable target
      ↓
CanInteract?
      ↓
Use / Hold / Release / Cancel
      ↓
runtime event
```

- [ ] `Interactable` interface/component
- [ ] camera raycast interaction
- [ ] optional body/overlap trigger interaction
- [ ] proximity interaction
- [ ] configurable range
- [ ] focus/hover target
- [ ] interaction prompt
- [ ] press interaction
- [ ] hold interaction
- [ ] release interaction
- [ ] cancel interaction
- [ ] disabled/locked state
- [ ] cooldown
- [ ] success/failure result
- [ ] authority validation before shared state changes
- [ ] emit meaningful game events

---

# Phase 5 - Automatic gameplay components

Dropping a common gameplay object should attach sensible default components. Users should not need ten logic nodes merely to make a normal door behave like a door.

## Door

- [ ] collider
- [ ] interactable
- [ ] open/close state
- [ ] rotate or slide mode
- [ ] locked/unlocked state
- [ ] optional key/permission requirement
- [ ] open/close animation hook
- [ ] obstruction handling
- [ ] auto-close option
- [ ] `door.opened` / `door.closed` events

## Button

- [ ] focus/overlap detection
- [ ] press offset
- [ ] travel clamp
- [ ] smooth press/release
- [ ] momentary/toggle modes
- [ ] one-shot option
- [ ] `button.pressed` / `button.released` events

## Lever / switch

- [ ] two-state switch
- [ ] multi-position option
- [ ] animation hook
- [ ] state-change event

## Pickup / item

- [ ] pickup
- [ ] drop
- [ ] item ID
- [ ] inventory handoff
- [ ] carry/socket option
- [ ] authority check for shared items

## Console / use point

- [ ] activate
- [ ] local UI hook
- [ ] game-logic trigger hook
- [ ] player permission rules
- [ ] NPC interaction permission rules

## Weapon foundation

Do not attempt a complete shooter system in the first FPV pass.

- [ ] weapon component contract
- [ ] equip/unequip
- [ ] fire input
- [ ] ammo state
- [ ] reload state
- [ ] hitscan/raycast adapter
- [ ] projectile adapter later
- [ ] recoil event
- [ ] damage event
- [ ] animation/audio hooks

---

# Phase 6 - Visual Game Logic integration with AI Playground

The node graph is authored in AI Playground but **immediate gameplay execution belongs in WonderPlay**.

Do not send every button press, collision or shot through an n8n-style backend request.

Bad runtime path:

```text
Player input
  ↓
HTTP
  ↓
workflow server
  ↓
HTTP response
  ↓
world changes
```

Required path for immediate gameplay:

```text
Player input / world event
  ↓
WonderPlay GameLogicRuntime
  ↓
validated graph instruction
  ↓
world action
```

## Shared graph contract

- [ ] define versioned Game Logic JSON schema
- [ ] define `node_id`
- [ ] define `logic_id`
- [ ] define `entity_id`
- [ ] define trigger node contract
- [ ] define condition node contract
- [ ] define action node contract
- [ ] define graph edges/ports
- [ ] define variables/state contract
- [ ] validate all references before Play/Publish
- [ ] reject unknown/untrusted runtime actions

Example:

```json
{
  "version": 1,
  "nodes": [
    { "id": "t1", "type": "player.interact", "entityId": "door-42" },
    { "id": "c1", "type": "inventory.has", "itemId": "blue-key" },
    { "id": "a1", "type": "door.open", "entityId": "door-42" }
  ],
  "edges": [
    { "from": "t1", "to": "c1" },
    { "from": "c1", "port": "true", "to": "a1" }
  ]
}
```

## Registered runtime actions

Prefer registered capabilities over arbitrary user JavaScript execution.

- [ ] `door.open`
- [ ] `door.close`
- [ ] `audio.play`
- [ ] `animation.play`
- [ ] `inventory.add`
- [ ] `inventory.remove`
- [ ] `entity.spawn`
- [ ] `entity.destroy`
- [ ] `scene.load`
- [ ] `player.damage`
- [ ] `player.heal`
- [ ] `score.add`
- [ ] `npc.emitEvent`

## Execution classes

Support explicit execution targets rather than treating every node the same:

- [ ] `client` for immediate local game presentation/interaction
- [ ] `server` for authoritative shared state
- [ ] `workflow` for slow/external AI/API automation

Example:

```text
Player opens chest
   ↓ client: play chest animation
   ↓ server: validate reward
   ↓ workflow: optionally generate lore / external AI task
```

---

# Phase 7 - WonderPlay ↔ AI Playground UX

Keep the user in one project context even though the systems are separate repos.

- [ ] pass `workspace_id`
- [ ] pass `project_id`
- [ ] pass optional `scene_id`
- [ ] pass optional `entity_id`
- [ ] pass `logic_id` when editing an existing graph
- [ ] return to the same WonderPlay project/entity after logic editing
- [ ] show attached logic name/status in WonderPlay inspector
- [ ] avoid creating another node editor in the main repo

Suggested object inspector flow:

```text
Door_01
  Transform
  Material
  Collision
  Interaction
  Logic: Locked Door Logic
  [Edit Logic]
```

---

# Phase 8 - NPC-AI-SIM integration

NPC brains remain separate from player/game logic.

```text
PLAYER presses button
      ↓
WonderPlay changes world state
      ↓
world event: button.pressed
      ↓
NPC perception bridge
      ↓
NPC-AI-SIM/runtime decides reaction
      ↓
NPC action request
      ↓
WonderPlay validates/executes action
      ↓
character animation presents result
```

- [ ] attach an `npc_id` / brain reference to a scene character
- [ ] player entered NPC sight event
- [ ] player left NPC sight event
- [ ] player proximity event
- [ ] player interaction event
- [ ] player used object event
- [ ] player attacked/damaged event
- [ ] dialogue target event
- [ ] world-object state-change events
- [ ] NPC action requests remain capability-gated
- [ ] NPC runtime never receives control of the human player's inputs
- [ ] preserve `workspace_id` + `project_id` + `npc_id`

---

# Phase 9 - WonderPlay editor UI

The main WonderPlay experience should behave like one project workspace with modes, not many setup pages.

## Persistent project shell

- [ ] project name
- [ ] save status
- [ ] Build mode
- [ ] Logic mode/link
- [ ] Play button
- [ ] Publish button
- [ ] profile/workspace context

## Build mode

- [ ] asset/scene tree
- [ ] center PlayCanvas/WebGL editor
- [ ] contextual right inspector
- [ ] bottom console/assets/runtime drawer where useful
- [ ] player settings
- [ ] spawn point
- [ ] interactable settings
- [ ] logic attachment
- [ ] NPC brain attachment

## Play mode

- [ ] save/validate before entering play
- [ ] hide editor chrome
- [ ] start configured player controller
- [ ] acquire pointer lock for FPV where required
- [ ] execute scene logic
- [ ] activate NPC runtimes
- [ ] Escape exits pointer lock
- [ ] return to editor without losing scene state
- [ ] display runtime errors after test

Do not force every heavy canvas/system to render continuously while hidden. Preserve project/runtime state, but pause or reduce expensive rendering when another mode is active.

---

# Phase 10 - Player animation bindings

Player animation is presentation for the human-controlled character and is separate from NPC training.

- [ ] idle
- [ ] walk
- [ ] run
- [ ] sprint
- [ ] jump
- [ ] fall
- [ ] land
- [ ] crouch
- [ ] interact/use
- [ ] pickup/carry
- [ ] equip
- [ ] attack/fire
- [ ] reload
- [ ] first-person arms option
- [ ] third-person avatar option
- [ ] GLB/GLTF clip mapping
- [ ] animation state driven by actual controller/runtime state

---

# Phase 11 - Multiplayer / authority

Local camera and input stay client-side. Shared game state must not trust arbitrary browser decisions.

## Client/local

- [ ] camera
- [ ] local input
- [ ] local UI
- [ ] non-authoritative particles
- [ ] local-only sounds where safe

## Authoritative/server validated

- [ ] player identity
- [ ] inventory ownership
- [ ] damage/health where multiplayer matters
- [ ] shared item ownership
- [ ] score/currency
- [ ] shared door/object state
- [ ] multiplayer spawn state
- [ ] NPC/world state affecting multiple users

## Workspace/session identity

- [ ] authenticated `user_id`
- [ ] `workspace_id`
- [ ] `project_id`
- [ ] personal workspace sessions private by default
- [ ] team workspace sessions intentionally shared
- [ ] role/permission checks
- [ ] reconnect/resume

---

# Phase 12 - Dashboard / command-center broadcasting

The main dashboard is the central project command center, but it should receive **meaningful events**, not frame-level telemetry.

Broadcast examples:

- [ ] `game.test.started`
- [ ] `game.test.stopped`
- [ ] `build.started`
- [ ] `build.completed`
- [ ] `build.failed`
- [ ] `logic.updated`
- [ ] `scene.updated`
- [ ] `npc.updated`
- [ ] `runtime.error`
- [ ] `player.joined` for shared sessions

Do not broadcast:

- raw mouse movement
- every WASD input
- camera rotation each frame
- player transform every frame to dashboard UI

The multiplayer runtime may replicate transforms where required, but that is a different concern from dashboard activity broadcasting.

---

# Phase 13 - Publish / package validation

Before publishing, validate the assembled project instead of silently shipping broken references.

```text
Scene
+ Assets
+ Player preset
+ Game logic
+ NPC brain references
+ Runtime configuration
        ↓
      Validate
        ↓
      Package
        ↓
      Publish
```

- [ ] validate scene exists
- [ ] validate player spawn
- [ ] validate selected player controller preset
- [ ] validate referenced assets
- [ ] validate game-logic graph schema
- [ ] validate entity references in graph
- [ ] validate NPC brain references
- [ ] validate animation references
- [ ] warn on missing optional assets
- [ ] block on missing required runtime components
- [ ] produce clear user-facing diagnostics

---

# Phase 14 - Validation checklist

## FPV

- [ ] player spawns into a WonderPlay scene
- [ ] pointer lock works
- [ ] WASD works
- [ ] sprint works
- [ ] crouch works
- [ ] jump/grounding works
- [ ] collisions work
- [ ] Escape returns to editor

## Interaction

- [ ] interaction ray finds valid target
- [ ] prompts only appear for valid targets
- [ ] button can press/release
- [ ] door can open/close
- [ ] locked door rejects invalid interaction
- [ ] pickup/drop works

## Logic

- [ ] AI Playground graph can be associated with same project
- [ ] graph references a WonderPlay entity by stable ID
- [ ] local runtime executes immediate graph actions without backend round-trip
- [ ] invalid graph is rejected before Play
- [ ] slow workflow node does not block the game loop

## NPC

- [ ] WonderPlay character can reference an NPC brain
- [ ] player/world events reach NPC perception boundary
- [ ] NPC action request returns to WonderPlay
- [ ] NPC cannot control the human player

## Dashboard

- [ ] meaningful test/build events appear in project activity
- [ ] no frame-level telemetry floods dashboard

## Performance

- [ ] low-end browser test
- [ ] adaptive quality test
- [ ] paused hidden modes do not waste major GPU/CPU resources
- [ ] scene does not reload unnecessarily when leaving Play mode

---

# Explicit non-goals for this phase

- [ ] do not create a new WonderPlay repository
- [ ] do not move FPV into AI-PLAYGROUND
- [ ] do not move FPV into NPC-AI-SIM
- [ ] do not move current work into Vanguard Engine
- [ ] do not rebuild AI Playground's graph editor inside main repo
- [ ] do not make cloud GPU mandatory
- [ ] do not execute arbitrary unvalidated JavaScript nodes by default
- [ ] do not route frame-by-frame gameplay through the dashboard

---

# Product boundary summary

```text
MAIN DASHBOARD
central project/workspace command center
              │
              ▼
WONDERPLAY / MAIN REPO
BUILD WORLD + PLAYER + PLAY MODE
   │                  │
   │                  ├──── visual logic authoring ───→ AI-PLAYGROUND
   │                  │
   │                  ├──── NPC brain editing ─────────→ NPC-AI-SIM
   │                  │
   │                  └──── meaningful activity ───────→ DASHBOARD
   │
   ▼
BROWSER GAME RUNTIME
FPV / TPV / TOP-DOWN
physics + interactions + game logic execution
```

The central rule is simple:

**AI Playground describes game rules. NPC-AI-SIM supplies autonomous character intelligence. WonderPlay executes the actual playable world. The main dashboard coordinates the project and reports meaningful state.**
