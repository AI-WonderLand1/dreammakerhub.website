# WonderBuild Website Builder — 3-Step Flow TODO

## Scope guardrail

This work is **ONLY** for the WonderBuild website builder experience in `dreammakerhub.website`.

Do **not** restructure, merge, rename, or repurpose:

- NPC-AI-SIM
- WonderPlay
- PlayCanvas/WebGL game or scene tooling
- NPC simulation/runtime code
- dedicated 3D/game routes

Website-builder 3D support means only normal website media assets (for example GLB/GLTF embeds/viewers), not a scene editor.

---

## Target user journey

Authentication is outside the 3 build steps.

```text
LOGIN / REGISTER
      ↓
DASHBOARD / PROJECTS
      ↓
1. START
   - Blank website
   - Pick a template
   - Generate with AI
      ↓
2. BUILD
   - Drag and drop
   - AI editing
   - Pages
   - CMS
   - Assets (image/video/3D web assets)
   - Components
   - Code when needed
   - Responsive design
   - Preview as an editor mode, not a separate workflow step
      ↓
3. PUBLISH
   - Domain
   - SEO
   - final checks
   - deploy/go live
```

Mental model: **START → BUILD → PUBLISH**.

Do not expose internal implementation steps such as project creation, state conversion, renderer handoff, or file seeding as separate user-facing stages.

---

## Current route/code audit

### Authentication

- Canonical auth UI: `/public-pages/auth`
- `/auth/login` redirects to `/public-pages/auth`.
- Auth defaults to `/dashboard/projects` when no `redirectTo` is supplied.
- `redirectTo` is already supported and sanitized.

### Dashboard projects

File: `apps/web/app/(workspace)/dashboard/projects/page.tsx`

Current behavior:

- `New Project` creates the record with `/api/projects` but leaves the user on the projects page.
- WonderBuild project edit icon links to `/wonder-build?projectId=...`.
- `/wonder-build` does not currently open that project in the real editor, so the project link is pointed at the wrong surface.

Required behavior:

- Creating a WonderBuild project should move directly into the real builder.
- Existing WonderBuild projects should open `/wonder-build/builder?projectId=...`.
- Project creation is implementation detail; it should not become another user-facing step.

### `/wonder-build`

File: `apps/web/app/(builder)/wonder-build/page.tsx`

Current behavior:

- Renders `TemplateLibraryApp` directly.
- The same template app is also implemented by `/wonder-build/templates`.
- `next.config.mjs` redirects `/wonder-build/templates` back to `/wonder-build`.

Conclusion:

- `/wonder-build` is currently functioning as the template/batch application, not a clean START screen.
- `/wonder-build/templates` is effectively a duplicate route implementation hidden behind a redirect.

### Template library internal flow

Main file: `apps/web/lib/wonder-build/template-library/App.tsx`

Current behavior:

- Holds template data in local React state.
- Has internal tabs `prompts` and `visual-builder`.
- `visual-builder` renders a second editing/preview surface: `VisualRenderer`.
- Template selection often switches to `VisualRenderer` rather than opening the real builder.
- The real project is only created later in `handleOpenInBuilder()`.
- `handleOpenInBuilder()`:
  1. POSTs `/api/projects`
  2. converts the template with `builderAdapter.ts`
  3. writes `builder-state.json`
  4. redirects to `/wonder-build/builder?projectId=...`
- That handoff is currently exposed too late in the flow (through deploy/open-in-builder behavior).

Required behavior:

- `VisualRenderer` may remain as a **quick preview only**, not a second editor.
- Any action labeled Edit/Customize/Open should create/seed the project and immediately open the real builder.
- AI-generated templates should follow the same path.

### Duplicate website-builder state models

Files:

- `apps/web/lib/wonder-build/template-library/types.ts`
- `apps/web/lib/wonder-build/template-library/utils/builderAdapter.ts`
- `apps/web/lib/builder/types.ts`

Current flow:

```text
WonderBuildTemplate / WonderBuildElement
        ↓
VisualRenderer
        ↓
builderAdapter
        ↓
CanvasElement[]
        ↓
VisualBuilderCanvas
```

Risk:

- Two website-editing models can drift.
- Adapter mappings can be lossy (for example grid/footer/nav transformations).
- There is no obvious reverse round-trip from the real builder back to template state.

Long-term target:

```text
Template / AI generation
        ↓
canonical builder state
        ↓
VisualBuilderCanvas
```

Do not rewrite all schemas in the first pass. First remove the duplicate user-facing editing step, then consolidate the data model safely.

### Real website builder

Route: `/wonder-build/builder`

Main file: `apps/web/app/(builder)/wonder-build/builder/page.tsx`

This is the canonical website editor. It already includes or references:

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
- storage/pipeline/project persistence
- publish controls

Therefore **Preview belongs inside BUILD**, and Publish remains the final action.

### Builder navigation

File: `apps/web/app/(builder)/wonder-build/components/SovereignNavBar.tsx`

Current links:

- Hub
- Agent
- Builder
- 3D
- Dashboard

For the website-builder surface this is too product/tool-oriented and mixes unrelated WonderPlay/3D navigation into the website editing workflow.

Target for website builder chrome:

- Dashboard / Projects
- Start
- Builder
- Preview
- Publish

AI should be available **inside** Builder, not require a separate workflow step.

Do not delete the Agent or 3D routes; only remove them from the website-builder-specific primary workflow where appropriate.

### Builder metadata

File: `apps/web/app/(builder)/wonder-build/builder/layout.tsx`

Current description says `Build 3D worlds and games in WonderBuild.`

This is wrong for the website builder and must be corrected without changing WonderPlay/3D products.

### Global footer/chrome leak into editor

File: `apps/web/app/layout.tsx`

`<Footer />` is rendered globally after every route, including full-screen editors.

This is why the visual builder screenshot shows the large marketing footer under the editor.

Target:

- Marketing/public pages keep the Footer.
- Full-screen website builder/editor routes do not render the marketing Footer.

Implement this with route-aware chrome rather than deleting the Footer globally.

### Preview route

`next.config.mjs` currently redirects:

- `/wonder-build/preview` → `/wonder-build/builder?tab=preview`

This matches the target architecture: Preview is a builder mode, not a separate step.

### Broken/stale website-builder links

The repository still contains references to `/wonder-build/studio`, but there is no current `apps/web/app/(builder)/wonder-build/studio/page.tsx` route on `Master`.

Website-builder links that point to missing `/wonder-build/studio` must be redirected or repointed to the current START/BUILD flow.

Do not touch unrelated 3D/NPC Studio components just because they contain the word `studio`.

### Central navigation

File: `apps/web/lib/navigation.ts`

Current BUILD navigation exposes separate entries for:

- WonderBuild
- Visual Builder
- AI Agent

This reinforces the impression of separate website-building products.

Target wording should express one product with stages/capabilities:

- Start / Templates / AI Start
- Builder
- Preview (inside Builder)
- Publish (inside Builder)

Keep CODE/WonderSpace and 3D/WonderPlay registry sections intact.

---

## Implementation plan

### Phase 1 — Fix flow/routing without large schema rewrites

- [x] Audit current auth, dashboard, WonderBuild, builder, preview, publish, template, and navigation routes.
- [x] Confirm canonical real editor is `/wonder-build/builder`.
- [x] Confirm Preview already belongs in builder via `?tab=preview`.
- [ ] Fix dashboard WonderBuild project links to open `/wonder-build/builder?projectId=...`.
- [ ] After creating a WonderBuild project from Dashboard, immediately open the builder.
- [ ] Preserve WonderPlay project creation behavior; do not merge it into this flow.
- [ ] Make template `Customize/Edit` actions call the existing `handleOpenInBuilder()` path directly.
- [ ] Rename internal `Visual Renderer` behavior to `Quick Preview` where retained.
- [ ] Remove `Deploy` as the gateway required to reach the real builder.
- [ ] Keep Publish in the real builder.
- [ ] Correct builder metadata from 3D/game language to website-builder language.
- [ ] Hide the global marketing Footer on full-screen WonderBuild editor routes.
- [ ] Add a safe redirect/repoint for stale `/wonder-build/studio` website-builder links.

### Phase 2 — Turn `/wonder-build` into a clean START experience

- [ ] Present three primary choices only:
  - Blank website
  - Choose template
  - Generate with AI
- [ ] Automatically create project records behind the scenes.
- [ ] Template selection seeds builder state then opens Builder.
- [ ] AI generation seeds builder state then opens Builder.
- [ ] Keep batch/template power-user tools accessible as secondary controls, not the main workflow.
- [ ] Remove `Visual Renderer` as a separate editing destination.

### Phase 3 — Make BUILD feel like Framer + WordPress (website builder only)

- [ ] Pages panel/navigation inside the editor.
- [ ] Site-level structure instead of a block-library-first mental model.
- [ ] CMS collections/posts/custom content management.
- [ ] Assets library for images, video, documents, and simple 3D web assets.
- [ ] Reusable components/global sections.
- [ ] Global styles/design tokens.
- [ ] Stronger responsive controls and breakpoints.
- [ ] Framer-like canvas interactions: resize, alignment, layout controls, positioning.
- [ ] Keep large block catalog under Insert/Search rather than dominating the UI.

### Phase 4 — Consolidate website-builder data model

- [ ] Define the real builder state as the canonical editable schema.
- [ ] Make templates generate canonical builder state directly where practical.
- [ ] Make AI generation target canonical builder state.
- [ ] Reduce/remove lossy `WonderBuildElement → CanvasElement` conversions.
- [ ] Add migration/compatibility support for existing templates before deleting old model code.

### Phase 5 — Publish polish

- [ ] Publish panel includes domain, SEO, social metadata, validation, and go-live controls.
- [ ] Keep Publish as Step 3, reachable directly from Builder.
- [ ] Confirm published preview, custom domain, and revision flows remain intact.

---

## Definition of done for the first usable flow

A new user can:

1. Register/sign in.
2. Start from blank, a template, or AI.
3. Land directly in one canonical editor.
4. Use AI and drag/drop in that editor.
5. Preview without leaving the editor.
6. Publish from the editor.

No user-facing `Visual Renderer → Deploy modal → Open in Builder` handoff is required.

No changes to NPC-AI-SIM or WonderPlay are required for this milestone.
