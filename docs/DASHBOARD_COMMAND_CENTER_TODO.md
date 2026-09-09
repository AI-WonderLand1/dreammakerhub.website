# Dashboard Command Center / Project Hub TODO

## Purpose

Keep the main DreamMakerHub dashboard as the **central command center** for the platform without turning it into a wall of every feature at once.

The dashboard should coordinate projects, workspace identity, live status, recent activity, launches into specialized tools, code access, builds and publishing. It should **not** try to become WonderBuild, WonderPlay, AI Playground, NPC-AI-SIM and the cloud IDE on one screen.

The core UX rule:

```text
DASHBOARD
  = choose project + see important status

PROJECT VIEW
  = everything belonging to one project

SPECIALIZED TOOLS
  = deep editing/work
```

## Existing foundation to preserve

Current main-repo code already provides useful pieces that should be refined rather than rebuilt:

- `/dashboard` currently loads projects and links to project files/builders.
- `/dashboard/projects/[id]` already exists as a project hub.
- `/dashboard/projects/[id]/files` already provides a browser file tree + code editor + save/create/rename/delete/import/export behavior.
- project file changes already broadcast through the realtime event helper.
- the project hub already renders `WonderRealtimeWidget` for live project activity.
- main repo already owns authentication, project APIs and dashboard routing.

Do not throw those away. Reorganize them around a simpler product model.

---

# Locked information architecture

## Main Dashboard

The main dashboard should answer four questions:

```text
What am I working on?
What changed?
Is anything broken?
Where do I go next?
```

Keep the main dashboard intentionally small:

```text
DASHBOARD
├── Workspace switcher
├── Continue working
├── Projects
├── Important status
├── Recent activity
└── New Project
```

Do **not** place full editors, giant asset browsers, full logs, billing forms or node graphs on the landing dashboard.

## Project View

Selecting a project should open a GitHub-repository-like project hub:

```text
My Project
────────────────────────────────────
Overview | Code | Build | Logic | Assets | NPCs | Play | Publish
```

Only tabs/actions relevant to that project type should be visible.

Examples:

- website project may not need Play/NPC tabs
- 3D/game project may show Build, Logic, NPCs and Play
- plain code/app project may primarily show Code, Build and Deploy

Avoid permanent navigation items that have no meaning for the selected project.

---

# Phase 1 - Simplify the main dashboard

Current `/dashboard` presents itself as **Files & Folders**. Refocus it into the central project launcher/status surface.

- [ ] replace the main heading with a project/workspace command-center concept
- [ ] do not expose the user's email as a large welcome/detail element unless useful
- [ ] show current workspace clearly
- [ ] add workspace switcher location in persistent shell
- [ ] show recently opened/updated projects first
- [ ] show project name
- [ ] show project type
- [ ] show last updated time
- [ ] show small health/build status where available
- [ ] provide `Continue` action
- [ ] provide one clear `New Project` action
- [ ] keep template access secondary
- [ ] avoid showing file-level controls on the root dashboard
- [ ] avoid duplicate project launcher sections

Suggested main screen:

```text
AI WONDERLAND
Personal Workspace                         [New Project]

Continue Working
┌─────────────────────────────────────────────┐
│ My FPS Game                       Updated 3m │
│ Game • Build ready • No errors              │
│ [Continue]                                  │
└─────────────────────────────────────────────┘

Projects
My Website
NPC Demo
AI Tool

Recent Activity
14:31 NPC Guard updated
14:28 Logic graph saved
14:25 Build completed
```

---

# Phase 2 - Project selection is the doorway to complexity

A user should choose a project **before** seeing project-specific files, NPCs, logic, scenes or builds.

Required flow:

```text
Dashboard
  ↓
Choose project
  ↓
Project Hub
  ↓
Choose Code / Build / Logic / NPC / Play / Publish
```

- [ ] clicking project name opens `/dashboard/projects/[id]`
- [ ] avoid sending project row directly to file manager by default
- [ ] preserve a quick shortcut to Code if desired
- [ ] remember the last-used project tool/view for `Continue`
- [ ] preserve workspace/project context when launching external product subdomains
- [ ] prevent cross-project context leakage

---

# Phase 3 - Project Hub redesign

The existing `/dashboard/projects/[id]` should become the central screen for a selected project.

## Header

- [ ] project name
- [ ] project type
- [ ] workspace name
- [ ] save/sync/build status
- [ ] compact project actions
- [ ] no raw/internal ID as prominent user-facing information
- [ ] move destructive delete into overflow/settings rather than primary header action

## Project navigation

Use tabs or a compact secondary navigation, not a collection of unrelated giant cards.

Suggested model:

```text
Overview
Code
Build
Logic
Assets
NPCs
Play
Publish
```

Show only what applies.

### Overview

- [ ] project summary
- [ ] continue last task
- [ ] important warnings/errors
- [ ] recent activity
- [ ] build/publish state
- [ ] connected tools

### Code

- [ ] reuse existing project file manager/editor
- [ ] open only files belonging to selected `project_id`
- [ ] include `Open Full IDE` upgrade/power-user action

### Build

- [ ] launch WonderBuild for website/app projects
- [ ] launch WonderPlay/3D editor for game/3D projects
- [ ] preserve project ID on launch

### Logic

- [ ] launch the correct AI Playground game-logic/workflow context
- [ ] preserve `workspace_id` + `project_id`
- [ ] show logic graph count/status only, not full node editor on dashboard

### Assets

- [ ] show project-owned assets
- [ ] keep full editing in appropriate tool
- [ ] avoid mixing platform source assets with user project assets

### NPCs

- [ ] show project NPC references/saved brains where applicable
- [ ] allow upload/import of user NPC brain/settings from project/dashboard context
- [ ] validate uploaded brain JSON before accepting
- [ ] launch NPC-AI-SIM with `workspace_id` + `project_id` + optional `npc_id`
- [ ] do not duplicate NPC brain editor in dashboard

### Play

- [ ] game/3D projects only
- [ ] launch WonderPlay Play/Test mode
- [ ] show last play-test result/errors

### Publish

- [ ] build validation status
- [ ] publish/deploy controls appropriate to project type
- [ ] release history later

---

# Phase 4 - Lightweight Code View

The lightweight Code View already has a substantial foundation at:

```text
/dashboard/projects/[id]/files
```

It should become the free, GitHub-like project code editor rather than another unrelated dashboard tool.

## Product rule

```text
Code View = quick browser editing
Cloud IDE = full development environment
```

## Code View should support

Existing or target capabilities:

- [ ] file/folder tree
- [ ] syntax highlighting
- [ ] edit file
- [ ] create file
- [ ] create folder
- [ ] rename
- [ ] delete
- [ ] save
- [ ] import
- [ ] export/download ZIP
- [ ] search
- [ ] changes/diff view
- [ ] basic formatting
- [ ] undo/redo
- [ ] project-scoped realtime save activity

## Add clear Full IDE escalation

- [ ] `Open Full IDE` button
- [ ] pass same `workspace_id` and `project_id`
- [ ] mount/open the same project files
- [ ] no need to create a cloud pod for simple Code View usage

Full IDE is for:

- terminal
- package installs
- compiler/build tools
- dev server
- Docker
- ports
- debugging
- advanced Git workflows

Do not require the full IDE to edit a simple text/source file.

---

# Phase 5 - Fix project-type routing and labels

Current project hub logic should be audited so button labels match destinations.

- [ ] verify every project type maps to the correct editor
- [ ] ensure WonderPlay/3D projects do not display misleading `Open in NPC AI SIM` labels
- [ ] ensure NPC-AI-SIM launch exists only when editing NPC brains/configs
- [ ] ensure WonderBuild launch is used for website/app builder projects
- [ ] ensure game/3D editor launch goes to WonderPlay/3D route
- [ ] remove stale/legacy route names only after checking dependencies
- [ ] centralize project-type → tool-launch mapping instead of duplicating conditions across components

Suggested conceptual mapping:

```text
wonderbuild / web_app
  → WonderBuild

game / 3d_scene / playcanvas
  → WonderPlay / 3D editor

NPC brain action
  → NPC-AI-SIM

Logic action
  → AI Playground

Code action
  → project Code View
```

---

# Phase 6 - Real-time command-center activity

The dashboard is the platform's **meaningful event view**, not a frame-level telemetry console.

## Project events worth broadcasting

- [ ] `project.created`
- [ ] `project.updated`
- [ ] `file.created`
- [ ] `file.saved`
- [ ] `file.renamed`
- [ ] `file.deleted`
- [ ] `scene.updated`
- [ ] `logic.updated`
- [ ] `npc.updated`
- [ ] `build.started`
- [ ] `build.completed`
- [ ] `build.failed`
- [ ] `publish.started`
- [ ] `publish.completed`
- [ ] `publish.failed`
- [ ] `game.test.started`
- [ ] `game.test.stopped`
- [ ] `runtime.error`
- [ ] team member activity where appropriate

## Do not broadcast into dashboard UI

- raw mouse movement
- each WASD key state
- camera rotation each frame
- every physics tick
- every player transform tick
- noisy low-level renderer telemetry

## Activity UI

- [ ] show only latest meaningful events by default
- [ ] `View all activity` opens deeper history
- [ ] severity for error/warning/success
- [ ] source product label when useful
- [ ] clicking an event takes user to relevant project/tool/item
- [ ] collapse repeated noisy events

Example:

```text
LIVE ACTIVITY
14:31  NPC Guard updated
14:30  Dungeon scene saved
14:28  Locked Door logic updated
14:25  Build completed
```

---

# Phase 7 - Workspace and team model

The dashboard should be the visible workspace boundary.

## Personal workspace

- [ ] every user gets Personal Workspace
- [ ] private by default
- [ ] personal projects remain personal unless intentionally moved/copied

## Team workspace

- [ ] workspace switcher
- [ ] owner/admin/editor-or-developer/viewer roles
- [ ] team project visibility scoped by membership
- [ ] team activity scoped to workspace
- [ ] shared play/runtime sessions only when intentionally enabled

## Project ownership direction

Move toward:

```text
project
  workspace_id
  created_by_user_id
  project_id
```

rather than relying only on `project.user_id` as the long-term ownership model.

- [ ] audit existing project ownership checks
- [ ] add workspace membership authorization before migration
- [ ] do not weaken current authorization while transitioning

---

# Phase 8 - Central launch contract

All specialized products should launch from the project hub using the same context.

Required launch context:

```text
user/session
workspace_id
project_id
optional scene_id
optional entity_id
optional npc_id
optional logic_id
return target
```

- [ ] create one reusable launch/context helper
- [ ] sign/validate sensitive launch context server-side where required
- [ ] never put raw provider secrets into launch URLs
- [ ] preserve return path back to project hub
- [ ] show destination product in UI before launch
- [ ] avoid asking user to choose the same project again after launch

---

# Phase 9 - Main dashboard navigation cleanup

The persistent dashboard shell should remain small.

Recommended top-level navigation:

```text
Dashboard
Projects
Assets
Team
```

Potentially keep other global areas behind appropriate menus rather than permanently visible.

Profile menu can contain:

- account/profile
- settings
- billing/subscription
- API/BYOK configuration where appropriate
- sign out

Do not create a permanent top-level item for every platform capability.

- [ ] audit current dashboard sidebar/header items
- [ ] group related items
- [ ] hide low-frequency administrative items from primary nav
- [ ] keep platform product launchers contextual to project where possible
- [ ] keep Docs/Help accessible but secondary

---

# Phase 10 - New Project flow

Keep project creation short.

Target:

```text
New Project
  ↓
Blank / Website / Game / App
  ↓
Project opens
```

Optional templates can be offered without forcing a wizard.

- [ ] project name
- [ ] project type
- [ ] optional starter/template
- [ ] create
- [ ] immediately open project hub or relevant editor
- [ ] no multi-page setup wizard unless a feature truly requires it

For games, genre preset can happen as a compact choice:

- Blank
- FPS
- First-Person RPG
- Third-Person
- Top-Down RPG

Selecting a genre configures defaults and opens WonderPlay. It should not create another onboarding sequence.

---

# Phase 11 - Dashboard visual-density rules

The central command center should feel powerful without becoming visually noisy.

## Main dashboard

Use:

- project cards/rows
- one compact status area
- one recent activity area
- one primary create action

Avoid:

- giant analytics walls
- multiple competing CTAs
- full runtime consoles
- full editors
- duplicated asset/NPC lists
- dozens of persistent navigation links

## Project hub

Use progressive disclosure:

- Overview first
- tabs/secondary nav for deeper project areas
- drawers/modals for small settings
- specialized product launch for complex editing

## Status hierarchy

Only promote problems that require action:

1. blocking error
2. warning
3. build/publish status
4. normal activity

Do not make routine background activity visually compete with failures.

---

# Phase 12 - Dashboard/project validation checklist

## Main dashboard

- [ ] user can identify current workspace immediately
- [ ] user can find recent project in one glance
- [ ] user can open a project in one click
- [ ] user can create a project in one obvious action
- [ ] dashboard does not show full project internals before project selection

## Project hub

- [ ] project name and type are clear
- [ ] Code opens selected project's files only
- [ ] Build opens correct builder/editor
- [ ] Logic opens correct AI Playground project context
- [ ] NPC opens correct NPC-AI-SIM context
- [ ] Play opens WonderPlay Play/Test for game projects
- [ ] return path preserves project selection

## Code View

- [ ] file manager loads only selected project's files
- [ ] save persists correctly
- [ ] realtime activity reports file save meaningfully
- [ ] user can open Full IDE without selecting project again

## Realtime

- [ ] scene save appears
- [ ] NPC update appears
- [ ] logic update appears
- [ ] build result appears
- [ ] runtime failure appears prominently
- [ ] no frame-level telemetry floods UI

## Mobile/small screens

- [ ] project chooser remains usable
- [ ] activity does not push primary actions off-screen
- [ ] project tab navigation can collapse/scroll cleanly
- [ ] Code View can warn when full desktop editing is recommended rather than becoming unusable

---

# Explicit non-goals

- [ ] do not make the dashboard the full WonderPlay editor
- [ ] do not embed the complete AI Playground graph on the root dashboard
- [ ] do not duplicate NPC-AI-SIM inside dashboard
- [ ] do not replace the existing project Code View with a cloud IDE
- [ ] do not launch a Coder pod for every simple file edit
- [ ] do not show every platform feature in top-level navigation
- [ ] do not create another repo for dashboard orchestration
- [ ] do not make dashboard realtime a raw telemetry stream

---

# Target UX summary

```text
LOGIN
  ↓
DASHBOARD
choose workspace / choose project
  ↓
PROJECT HUB
Overview | Code | Build | Logic | Assets | NPCs | Play | Publish
  │          │       │       │              │       │
  │          │       │       │              │       └─ WonderPlay Play Mode
  │          │       │       │              └───────── NPC-AI-SIM
  │          │       │       └──────────────────────── AI Playground
  │          │       └──────────────────────────────── WonderBuild/WonderPlay
  │          └──────────────────────────────────────── existing browser Code View
  │
  └─ live meaningful project status/activity
```

The central rule:

**Dashboard = overview, project selection, launch and status. Project Hub = one project's command center. Specialized tools = deep work.**
