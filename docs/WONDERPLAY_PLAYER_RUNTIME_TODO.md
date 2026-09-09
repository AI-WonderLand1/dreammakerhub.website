# WonderPlay Player Runtime TODO

## Ownership

This system belongs to **DreamMakerHub / WonderPlay 3D Studio in the main `dreammakerhub.website` repo**.

It does **not** belong to AI Playground and it does **not** belong inside NPC-AI-SIM.

- **WonderPlay / main repo** owns user-controlled player characters, first-person/third-person controls, interaction, collision, scene objects, multiplayer authority and gameplay execution.
- **NPC-AI-SIM** owns autonomous NPC cognition, skills, perception, dialogue, memory and NPC action selection.
- **AI Playground** owns advanced AI workflows, agents, external automation and orchestration.

The Unreal Blueprint reference supplied for this TODO is a design reference for player interaction logic only. Do not copy Unreal source/code into AI Wonderland. Reimplement the behavior independently in the WonderPlay runtime.

## Core rule

A user-controlled FPV character is **not an NPC**.

```text
PLAYER INPUT
    ↓
PLAYER CONTROLLER
    ↓
INTERACTION / MOVEMENT RUNTIME
    ↓
SCENE OBJECTS
    ↓
OPTIONAL GAME EVENTS
    ↓
NPC PERCEPTION / REACTION
```

NPCs may react to player actions, but NPC-AI-SIM must not own the player's movement or interaction controller.

---

# Phase 1 — Browser-first player controller

- [ ] create engine-neutral `PlayerController` contract
- [ ] pointer-lock mouse look
- [ ] WASD movement
- [ ] configurable walk/run speed
- [ ] jump
- [ ] crouch
- [ ] sprint
- [ ] gravity / grounded state
- [ ] collision handling
- [ ] camera pitch/yaw limits
- [ ] configurable FOV
- [ ] gamepad input
- [ ] input rebinding
- [ ] pause/input-capture state
- [ ] browser WebGPU/WebGL2 compatible implementation
- [ ] keep frame rendering on the user's browser/GPU

## Later modes

- [ ] optional third-person camera
- [ ] optional spectator/free-camera mode
- [ ] mobile/touch controls only after desktop controls are stable

---

# Phase 2 — Interaction system

Implement one reusable interaction layer instead of hard-coding every object type.

```text
Player camera / body
      ↓
interaction query
(ray / overlap / proximity)
      ↓
Interactable target
      ↓
CanInteract?
      ↓
Begin / Use / Hold / Release / Cancel
      ↓
runtime event
```

- [ ] `Interactable` interface/component
- [ ] interaction raycast from camera
- [ ] optional overlap/proximity interaction volume
- [ ] interaction range
- [ ] focus/hover target
- [ ] interaction prompt
- [ ] press interaction
- [ ] hold interaction
- [ ] release interaction
- [ ] cancel interaction
- [ ] disabled/locked state
- [ ] cooldown
- [ ] authority check before world-state changes
- [ ] success/failure result
- [ ] runtime event emission

---

# Phase 3 — Reusable interactable objects

The Blueprint reference shows the family of behavior needed here: an overlapping player can trigger a component/object to move between defined positions. Implement this as a generic runtime interaction pattern, not a one-off Blueprint clone.

## Button

- [ ] player overlap/focus detection
- [ ] press depth/offset
- [ ] minimum/maximum travel clamp
- [ ] smooth move-to pressed state
- [ ] smooth return to released state
- [ ] pressed/released events
- [ ] optional toggle mode
- [ ] optional one-shot mode
- [ ] configurable activation delay

## Door

- [ ] open / close
- [ ] locked/unlocked
- [ ] key/permission requirement
- [ ] sliding and rotating variants
- [ ] auto-close option
- [ ] obstruction handling

## Lever / switch

- [ ] two-state switch
- [ ] multi-position switch
- [ ] interaction animation
- [ ] state event

## Pickup / carry

- [ ] pick up
- [ ] drop
- [ ] carry socket/offset
- [ ] throw later
- [ ] inventory handoff later

## Console / use point

- [ ] activate
- [ ] open local UI/action surface
- [ ] send world/runtime event
- [ ] allow NPC and player access through separate authority rules

---

# Phase 4 — Player animation bindings

Player animation is presentation for the human-controlled character, separate from NPC skill training.

- [ ] idle
- [ ] walk
- [ ] run
- [ ] jump
- [ ] fall
- [ ] land
- [ ] crouch
- [ ] interaction/use
- [ ] pickup/carry
- [ ] first-person hands/arms option
- [ ] third-person avatar animation option
- [ ] GLB/GLTF clip mapping
- [ ] animation state driven by real player-controller state

---

# Phase 5 — Multiplayer / workspace authority

- [ ] player identity comes from main-platform authenticated `user_id`
- [ ] scene/project comes from `workspace_id` + `project_id`
- [ ] personal workspace sessions remain private
- [ ] team workspace can intentionally host shared multiplayer/test sessions
- [ ] server/runtime validates interaction authority
- [ ] client does not authoritatively decide shared world state
- [ ] replicate player transform/state where multiplayer is enabled
- [ ] replicate interactable object state
- [ ] prevent duplicate/competing interaction execution
- [ ] reconnect/resume handling

---

# Phase 6 — NPC integration boundary

WonderPlay sends player/world events to NPC-AI-SIM/runtime adapters. NPC-AI-SIM reacts, but never controls the human player's inputs.

Examples:

```text
Player presses button
    ↓
WonderPlay changes button state
    ↓
world event: button.pressed
    ↓
nearby NPC perception event
    ↓
NPC may react
```

```text
Player approaches NPC
    ↓
WonderPlay proximity event
    ↓
NPC perception
    ↓
NPC chooses greet / speak / ignore / flee / other allowed action
```

- [ ] player entered NPC sight event
- [ ] player left NPC sight event
- [ ] player proximity event
- [ ] player interaction event
- [ ] player used object event
- [ ] player attacked/damaged event
- [ ] player dialogue target event
- [ ] world-object state-change events
- [ ] NPC response remains capability-gated and authoritative

---

# Phase 7 — WonderPlay editor UI

This belongs in the main 3D/WonderPlay editor, not NPC-AI-SIM.

- [ ] Player Controller settings panel
- [ ] first-person / third-person mode selector
- [ ] movement values
- [ ] camera/FOV values
- [ ] interaction range
- [ ] input mapping
- [ ] spawn point/player start
- [ ] Interactable component inspector for scene assets
- [ ] Button component settings
- [ ] Door component settings
- [ ] Lever component settings
- [ ] Pickup component settings
- [ ] test/play mode
- [ ] visible debug interaction ray/volume only when debug mode is enabled

---

# Phase 8 — Validation

- [ ] player can spawn into a WonderPlay scene
- [ ] mouse/keyboard movement works in browser
- [ ] collision and jump work
- [ ] button can be pressed and released
- [ ] button travel clamps correctly
- [ ] door interaction works
- [ ] pickup/drop works
- [ ] interaction prompts only appear for valid targets
- [ ] unavailable interactions fail cleanly
- [ ] world state remains authoritative in multiplayer/team mode
- [ ] player events can be forwarded to an NPC runtime
- [ ] NPC reaction does not grant control over the human player
- [ ] browser performance tested on low-end hardware

---

## Product boundary summary

```text
WonderPlay / main repo
  PLAYER CONTROLLER
  FPV/TPV CAMERA
  MOVEMENT
  COLLISION
  INTERACTIONS
  BUTTONS / DOORS / OBJECTS
  PLAYER ANIMATION
  MULTIPLAYER WORLD AUTHORITY
        │
        ├──── world/perception events ────→ NPC-AI-SIM
        │                                  autonomous NPC cognition
        │
        └──── optional workflow events ───→ AI Playground
                                           agents / automation / external APIs
```

Do not move the FPV player controller into NPC-AI-SIM or AI Playground.