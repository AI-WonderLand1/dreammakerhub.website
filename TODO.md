# WonderBuild Website Builder — 3-Step Flow TODO

## Scope guardrail

This work is **ONLY** for the WonderBuild website-builder experience in `dreammakerhub.website`.

Do **not** restructure, merge, rename, or repurpose:

- NPC-AI-SIM
- WonderPlay
- PlayCanvas/WebGL game or scene tooling
- NPC simulation/runtime code
- dedicated 3D/game routes

Website-builder 3D support means normal **web media assets** only. It does **not** mean a 3D scene editor.

### WonderBuild graphics / 3D asset rule

Allowed inside WonderBuild websites and templates:

- high-quality raster graphics and generated artwork
- SVG/icon graphics
- animated decorative web graphics
- image/video hero media
- GLB/GLTF models rendered as normal website content
- product/model viewers
- simple interactive 3D embeds that behave like a web component
- 3D hero/product assets used inside a normal website layout

Not part of WonderBuild:

- game-engine scene editing
- world/level editors
- scene graphs exposed as a game-development workflow
- NPC simulation tooling
- physics/gameplay systems
- WonderPlay editor features
- general PlayCanvas/WebGL scene-authoring UI

If a 3D asset is placed in WonderBuild, the user should treat it like an **image/video/component on a webpage**: insert it, size it, position it, configure presentation, preview it, and publish it.

---

## Product model

Authentication is outside the three build steps.

```text
LOGIN / REGISTER
      ↓
DASHBOARD / PROJECTS
      ↓
1. START
   - Blank website
   - Choose template
   - Generate with AI
      ↓
2. BUILD
   - Drag/drop
   - AI editing
   - Pages
   - CMS
   - Assets (images/video/3D web assets)
   - Components
   - Code when needed
   - Responsive design
   - Preview as an editor mode
      ↓
3. PUBLISH
   - Domain
   - SEO
   - validation
   - go live
```

Mental model: **START → BUILD (+ Preview) → PUBLISH**.

There are only **three user-facing workflow steps**. Blank / Template / AI are choices inside START. Pages / Insert / CMS / Assets / Components / Design / Interact / AI Assist / Code / Preview are tools inside BUILD. Domain / SEO / validation / deployment are tools inside PUBLISH.

Internal implementation details such as project creation, template conversion, `builder-state.json` seeding, renderer handoffs, autosave, revisions, persistence, adapters, APIs, and deployment plumbing must **never become extra user-facing steps**.

---

# Visual / UX source of truth

The current reference screenshots supplied for WonderBuild define the intended **product layout and interaction model**. They are not decorative mockups; they are the target for how the three-step product should feel and behave.

## STEP 1 — START layout

### START home

`/wonder-build`

Purpose: let the user choose how to begin, then move directly into BUILD.

Required structure:

```text
┌─────────────────────────────────────────────────────────────┐
│ WonderBuild                      1 START → 2 BUILD → 3 PUBLISH │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  START YOUR WEBSITE                                         │
│  Blank             Template             Generate with AI    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Rules:

- START is Step 1.
- Blank / Template / AI are **choices**, not additional numbered workflow steps.
- Creating/seeding a project happens behind the scenes.
- Every successful START choice lands directly in `/wonder-build/builder?projectId=...`.

### Template START page — target layout

`/wonder-build/templates`

The supplied template-library screenshot is the visual target.

Required shell:

```text
TOP BAR
WonderBuild | Home | Templates | AI Generate | My Projects | Assets | Learn
                                      Search templates | notifications | account

LEFT SIDEBAR
+ Create a Website
Templates
AI Generate
My Projects
Assets
Components
Domains
Integrations
Settings

MAIN HERO
Large high-impact visual / graphic
"Stunning Templates for Any Vision"
Search
feature/value badges

FILTER BAR
All | Business | Ecommerce | Portfolio | Blog | SaaS | Creative | ...
Sort / Popular

TEMPLATE GRID
large visual thumbnails
name + category
Preview
Use Template

AI HELP CARD
Ask AI to find a template or generate one
```

Functional requirements:

- [ ] Template search works.
- [ ] Category filters work.
- [ ] Sort/filter controls work.
- [ ] Preview opens a quick preview only.
- [ ] **Use Template** creates/seeds the project and opens BUILD directly.
- [ ] AI Generate stays inside START and also opens BUILD directly after generation.
- [ ] My Projects returns to project management without introducing a new builder step.
- [ ] Assets is a library/tool destination, not a new workflow stage.
- [ ] Template thumbnails use real polished graphics/screenshots, not generic placeholder cards.
- [ ] Hero area uses high-impact graphics consistent with the WonderBuild visual identity.
- [ ] No Deploy screen between template choice and BUILD.

## STEP 2 — BUILD layout

`/wonder-build/builder?projectId=...`

The supplied professional builder screenshot is the target layout.

Required shell:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ WonderBuild | Project name | Saved | device width | zoom | undo/redo       │
│                                               Preview | Publish | Deploy     │
├──────┬───────────────────────┬─────────────────────────────┬─────────────────┤
│ TOOL │ PAGES / INSERT / CMS  │                             │ DESIGN          │
│ RAIL │ ASSETS / COMPONENTS   │         LIVE CANVAS         │ INTERACT        │
│      │                       │                             │ AI ASSIST       │
│      │ Pages tree            │  select / drag / resize     │                 │
│      │                       │  drop / edit in place       │ Inspector       │
│      │ Layers tree           │                             │ controls        │
│      │                       │                             │                 │
└──────┴───────────────────────┴─────────────────────────────┴─────────────────┘
```

### BUILD top bar

Must provide:

- project name
- saved/autosave state
- desktop/tablet/mobile breakpoint controls
- width/viewport context
- zoom
- undo/redo
- Preview
- Publish
- deployment/go-live entry where appropriate

The builder must have **one coherent chrome layer**. Do not stack multiple competing headers/toolbars.

### BUILD left side

Primary tool rail / tabs:

- Pages
- Insert
- CMS
- Assets
- Components

Pages mode must show:

- searchable page list/tree
- Home clearly identified
- active page clearly highlighted
- Add Page
- rename
- page slug/path where useful
- Layers visible in the same site-building mental model

Insert mode must show:

- searchable component/block catalog
- categories
- drag onto canvas
- click to insert
- block library must not dominate the whole editor

### BUILD canvas

The canvas is a **real website page frame**, not a game-editor/infinite-world canvas.

Must support:

- drag blocks from Insert to canvas
- reorder blocks
- nested containers
- drag existing elements between valid containers
- visual selected-element outline
- floating selected-element toolbar
- direct route to Design inspector
- direct route to AI Assist for the selected element
- delete/duplicate actions
- resize handles
- alignment guides
- snapping feedback
- desktop/tablet/mobile page widths
- live visual updates
- scrolling as a website page
- zoom/pan only as editor navigation, not as the product mental model

Drag/drop correctness requirements:

- [ ] Root drop works.
- [ ] Nested container drop works at any depth.
- [ ] Reorder works at root.
- [ ] Reorder works inside nested containers.
- [ ] Move between containers works.
- [ ] Invalid child types are rejected using the real parent block type.
- [ ] A container cannot be dropped into its own descendants.
- [ ] Layers stay synchronized with canvas ordering/nesting.
- [ ] Pages remain isolated from each other.
- [ ] Undo/redo cannot leak content between pages.

### BUILD right side

Top-level modes:

- **Design**
- **Interact**
- **AI Assist**

Design must expose professional controls for the selected element:

- selector/current element
- layout
- flex/grid
- direction
- alignment
- justify
- gap
- wrap
- spacing / margin / padding
- width/height/min/max
- overflow
- typography
- color
- background
- borders/radius
- effects where appropriate
- responsive overrides
- accessibility

Interact must expose usable website interactions, not game logic:

- navigate/link
- scroll-to
- modal/toggle behavior
- hover effects
- basic animation/transitions
- form/webhook actions where supported and secured

AI Assist must operate on the **same live builder state** as drag/drop and Design.

AI must know:

- active page
- selected element
- element type
- element props
- element styles
- allowed block catalog

AI actions must support, at minimum:

- add a block to the page
- add a block inside a selected valid container
- edit selected element text/props
- edit selected element styles
- restyle a selected element
- make selected content more responsive
- help generate a section/page layout

AI must use the same Zustand/store actions and canonical page state as manual editing. It must **not** maintain a second hidden editable document.

### BUILD graphics quality

The builder itself should visually match the supplied dark professional reference:

- deep navy/black editor chrome
- violet/indigo/cyan accent lighting
- compact professional controls
- clear selected states
- strong typography hierarchy
- polished icons
- subtle glow rather than giant generic gradient cards
- high-quality template/site graphics in the canvas
- no toy-like emoji-first editor chrome once equivalent icons exist

The visual target is closer to a professional Framer/Webflow-class editor than a generic admin dashboard.

## STEP 3 — PUBLISH layout

Publish remains Step 3 and is reachable directly from BUILD.

Required responsibilities:

- publish the complete multi-page site
- generated site URLs
- domain/custom domain
- SEO title/description/social image
- validation/checklist
- publish status
- revision/republish behavior
- final go-live action

Do not add another required "Deploy Builder", "Visual Renderer", or "Export then Publish" workflow stage.

---

## Route/code audit

### Auth

- Canonical auth UI: `/public-pages/auth`.
- `/auth/login` redirects there.
- Auth supports a sanitized `redirectTo`.
- Default authenticated destination is `/dashboard/projects`.

### Dashboard/projects

File: `apps/web/app/(workspace)/dashboard/projects/page.tsx`

Original issue:

- WonderBuild projects linked to `/wonder-build?projectId=...` instead of the real editor.
- Creating a project left the user on the project list instead of entering the website editor.

First-pass fix:

- Existing WonderBuild projects now link directly to `/wonder-build/builder?projectId=...`.
- New WonderBuild projects immediately open the canonical builder.
- WonderPlay/PlayCanvas project creation remains a separate behavior.

### `/wonder-build`

File: `apps/web/app/(builder)/wonder-build/page.tsx`

Original issue:

- `/wonder-build` directly rendered the large template/batch app, making template selection, AI tools, previewing, and building look like one confusing pre-builder application.

First-pass fix:

- `/wonder-build` is now the **START** screen.
- It presents only three primary choices: Blank, Template, AI.
- Blank creates the project behind the scenes and goes directly to Builder.
- Old `/wonder-build?projectId=...` links are compatibility-routed into the real builder.

### `/wonder-build/templates`

File: `apps/web/app/(builder)/wonder-build/templates/page.tsx`

Original issue:

- It rendered the template app but `next.config.mjs` immediately redirected it back to `/wonder-build`, so two route implementations existed for one screen.

First-pass fix:

- The redirect was removed.
- `/wonder-build/templates` is now a Step-1 subflow for choosing/generating a starting point.

### Template-library internal flow

Main file: `apps/web/lib/wonder-build/template-library/App.tsx`

Original issue:

```text
Template / AI
   ↓
VisualRenderer
   ↓
Deploy modal
   ↓
Create project
   ↓
Convert state
   ↓
Real Builder
```

First-pass fix:

```text
Template / AI
   ↓
Create + seed project
   ↓
Real Builder
```

- Template Customize/Edit actions now call `handleOpenInBuilder()` directly.
- AI-generated templates now open the real builder directly.
- Search-grounded generated templates do the same.
- The Deploy modal is no longer the gateway to the actual editor.
- The old internal Visual Renderer is labeled **Quick Preview** and is no longer the main Customize destination.

### Duplicate website-builder models

Files:

- `apps/web/lib/wonder-build/template-library/types.ts`
- `apps/web/lib/wonder-build/template-library/utils/builderAdapter.ts`
- `apps/web/lib/builder/types.ts`

Current technical flow still contains:

```text
WonderBuildTemplate / WonderBuildElement
        ↓
builderAdapter
        ↓
CanvasElement[]
        ↓
VisualBuilderCanvas
```

Risk:

- Two editable schemas can drift.
- Adapter mappings can lose information.
- There is no obvious reverse round-trip.

Long-term target:

```text
Template / AI generation
        ↓
canonical builder state
        ↓
VisualBuilderCanvas
```

Do **not** delete the adapter until existing templates are migrated safely.

### Canonical website editor

Route: `/wonder-build/builder`

Main file: `apps/web/app/(builder)/wonder-build/builder/page.tsx`

Already contains:

- drag/drop canvas
- component library
- inspector
- layers
- templates
- files
- revisions/history
- AI assistant panel
- import/export
- Code / Design / Preview tabs
- project persistence/pipeline
- publish controls

Therefore:

- **AI belongs inside BUILD.**
- **Preview belongs inside BUILD.**
- **Publish is Step 3.**

### Website-builder navigation

File: `apps/web/app/(builder)/wonder-build/components/SovereignNavBar.tsx`

Original links mixed Hub / Agent / Builder / 3D / Dashboard.

First-pass website-builder chrome now emphasizes:

- Projects
- Start
- Build
- Publish

The Agent and 3D routes were not deleted. They were removed from the primary website-builder flow only.

### Global footer leak

File: `apps/web/app/layout.tsx`

Original issue:

- Marketing `<Footer />` rendered below full-screen editors.

First-pass fix:

- Added `apps/web/components/RouteAwareFooter.tsx`.
- Marketing footer is hidden on WonderBuild website-builder/start/template/editor surfaces.
- Unrelated WonderPlay/3D routes remain untouched.

### Preview route

`next.config.mjs` keeps:

- `/wonder-build/preview` → `/wonder-build/builder?tab=preview`

This is the desired architecture.

### Stale website-builder routes

First-pass compatibility shims:

- `/wonder-build/studio` → `/wonder-build`
- `/wonder-build/ai-builder` → `/wonder-build`

These shims apply to stale WonderBuild website links only; they do not alter NPC/WonderPlay studio code.

### Central navigation

File: `apps/web/lib/navigation.ts`

First-pass BUILD navigation now presents one WonderBuild product:

- Start Website
- Templates
- Website Builder

with the tagline:

**Start → Build + Preview → Publish**

WonderSpace/CODE and WonderPlay/3D registry sections remain separate.

---

## Phase 1 — Routing and workflow consolidation

- [x] Audit auth, dashboard, WonderBuild, template, builder, preview, publish, and primary navigation routes.
- [x] Confirm `/wonder-build/builder` as canonical website editor.
- [x] Confirm Preview is already an editor mode via `?tab=preview`.
- [x] Fix Dashboard WonderBuild project links to open canonical builder.
- [x] Open newly created Dashboard WonderBuild projects immediately in Builder.
- [x] Keep WonderPlay project creation separate.
- [x] Make template Customize/Edit actions call `handleOpenInBuilder()` directly.
- [x] Rename retained Visual Renderer UI to Quick Preview.
- [x] Remove Deploy as the required gateway into the real builder.
- [x] Keep Publish in the real builder.
- [x] Correct website-builder metadata that described it as a 3D/game editor.
- [x] Hide global marketing footer from full-screen WonderBuild website surfaces.
- [x] Add compatibility handling for stale WonderBuild Studio/AI-builder URLs.
- [ ] Simplify the duplicated/stacked headers inside `/wonder-build/builder` so the editor has one coherent chrome layer.
- [ ] Change remaining `Hub` wording inside Builder to `Start` or `Projects` where appropriate.
- [ ] Audit visible numbering/labels so only START / BUILD / PUBLISH are presented as workflow steps.

## Phase 2 — START experience

- [x] `/wonder-build` shows three primary choices: Blank / Template / AI.
- [x] Blank website project creation happens behind the scenes.
- [x] Template selection seeds builder state and opens Builder.
- [x] AI generation seeds builder state and opens Builder.
- [x] Keep batch/template power tools as secondary Start tools rather than workflow stages.
- [x] Stop using VisualRenderer as the normal editing destination.
- [ ] Remove misleading `01 / 02 / 03` numbering from Blank / Template / AI cards; they are choices inside Step 1, not three more steps.
- [ ] Bring `/wonder-build/templates` to the supplied high-impact template-library layout.
- [ ] Add real polished template thumbnails/graphics.
- [ ] Make template search/category/sort controls functional.
- [ ] Add proper loading/progress UI for project creation and template seeding.
- [ ] Add failure recovery if project is created but template state seeding fails.

## Phase 3 — BUILD: Framer + WordPress feel (website builder only)

- [ ] Match the supplied professional builder shell/layout.
- [ ] Make Pages a first-class panel/navigation concept.
- [ ] Add site-level structure instead of a block-library-first mental model.
- [ ] Keep Pages and Layers synchronized and usable together.
- [ ] Fix nested drag/drop so valid containers work at any depth.
- [ ] Add regression coverage for nested add/move/reorder/duplicate behavior.
- [ ] Add contextual floating selected-element controls.
- [ ] Make AI operate on active page + selected element using the same canonical store.
- [ ] Add CMS collections/posts/custom content management.
- [ ] Add unified Assets library for images, video, documents, and simple 3D web assets.
- [ ] Add reusable components/global sections.
- [ ] Add global styles/design tokens.
- [ ] Improve responsive controls/breakpoints.
- [ ] Add Framer-like resize handles.
- [ ] Add alignment guides/snapping feedback.
- [ ] Add stronger flex/grid/layout controls.
- [ ] Add positioning controls without turning the product into a game/scene editor.
- [ ] Move the large block catalog behind Insert/Search so it does not dominate the editor.
- [ ] Keep AI editing available contextually in the same editor.
- [ ] Make Design / Interact / AI Assist the primary right-panel mental model.
- [ ] Replace placeholder/toy-like editor visuals with polished icons/graphics where practical.

## Phase 4 — Canonical website data model

- [ ] Define builder state/`CanvasElement` model as the canonical editable representation.
- [ ] Make templates generate canonical builder state directly where practical.
- [ ] Make AI generation target canonical builder state.
- [ ] Reduce lossy `WonderBuildElement → CanvasElement` conversions.
- [ ] Add migration/compatibility for existing templates before removing old model code.

## Phase 5 — PUBLISH

- [ ] Consolidate domain setup into Publish.
- [ ] Add SEO title/description/social-image controls.
- [ ] Add final validation/checklist before go-live.
- [ ] Confirm custom domain, generated page, revision, and republish behavior.
- [ ] Keep Publish as Step 3 reachable directly from Builder.

---

## CI / repository blockers discovered while validating this branch

PR CI reaches `next build --webpack` but currently fails on repository-level missing modules outside the WonderBuild flow work:

- `@/infra/services/storage/provider`
- `@/infra/services/jobs/orchestrateScenePipeline`
- `@/infra/services/storage/promoteTempScene`
- `@/runners/registry.worker`
- `@t3-oss/env-nextjs`

The CI workflow also runs Node 20 while several installed packages declare Node 22+ requirements.

These failures are **not** being silently fixed in this WonderBuild-only change because they touch WonderSpace/shared dependency infrastructure. They should be handled as a separate repository build/CI repair task.

---

## Definition of done for the first usable website-builder flow

A user can:

1. Register/sign in.
2. Start from Blank, Template, or AI.
3. Land directly in one canonical website editor.
4. Use AI and drag/drop in that editor.
5. Preview without leaving that editor.
6. Publish from that editor.

There is no required user-facing `Visual Renderer → Deploy modal → Open in Builder` handoff.

NPC-AI-SIM and WonderPlay remain separate products/systems.