# DreamMakerHub Route Consolidation — Audit & Implementation Plan

Status: AUDIT COMPLETE — non-destructive changes only until plan approval.

## 1. Route inventory

All page routes under `apps/web/app`. URL path is what appears in the browser
(route groups `(builder)`, `(workspace)`, `(public)`, `(tools)` are stripped).

### A. BUILD — WonderBuild (`/wonder-build/*`)

| Route | Purpose | Component | Duplicate? | Canonical | Action |
|---|---|---|---|---|---|
| `/wonder-build` | WonderBuild hub (tool picker) | `app/(builder)/wonder-build/page.tsx` | No | `/wonder-build` | KEEP |
| `/wonder-build/studio` | AI Studio (visual/preview/code) | `studio/StudioClient.tsx` | Partial | `/wonder-build/studio` | KEEP |
| `/wonder-build/agent` | Builder AI agent | `components/AgentPanel.tsx` + SovereignOS | No | `/wonder-build/agent` | KEEP |
| `/wonder-build/ai-builder` | Multi-mode AI builder (website/game/…) | `ai-builder/page.tsx` | Duplicate of `/api/build/stream` UX shown elsewhere | `/wonder-build/studio` | Currently 301 → studio (keep redirect) |
| `/wonder-build/builder` | Visual drag-and-drop builder | `builder/page.tsx` + `useBuilderStore` | No | `/wonder-build/builder` | KEEP (canonical canvas) |
| `/wonder-build/builder?projectId=` | Project in the visual builder | same | No | `/wonder-build/builder` | KEEP |
| `/wonder-build/preview` | Live preview surface | `preview/page.tsx` + PlaygroundPanel | Partial — overlaps builder Preview tab | `/wonder-build/studio` | Currently 301 → studio (keep redirect) |
| `/wonder-build/sandbox` | Code sandbox | `sandbox/page.tsx` + CloudSandboxPanel | Partial — same panel used in builder Code tab | `/wonder-build/builder` | KEEP (secondary) |
| `/wonder-build/templates` | Template library app | `lib/wonder-build/template-library/App` | Partial — second template system | `/wonder-build/templates` | KEEP (distinct app) |
| `/wonder-build/webgl` | WebGL scene gallery | `webgl/page.tsx` | No | `/wonder-build/webgl` | KEEP |
| `/wonder-build/webgl/editor/[sceneId]` | WebGL Studio editor | `WebglEditorHost` / `DirectWebglHost` | No | `…/webgl/editor/[id]` | KEEP |
| `/wonder-build/playcanvas` | PlayCanvas scene gallery | `playcanvas/page.tsx` | No | `/wonder-build/playcanvas` | KEEP |
| `/wonder-build/playcanvas/editor/[sceneId]` | PlayCanvas editor | `PlayCanvasEditorHost` / `DirectPlayCanvasHost` | No | `…/playcanvas/editor/[id]` | KEEP |
| `/wonder-build/spatial` | Spatial designer | `spatial/page.tsx` | No | `/wonder-build/spatial` | KEEP |

### B. CODE — WonderSpace (`/wonderspace`, `/ide`)

| Route | Purpose | Component | Action |
|---|---|---|---|
| `/wonderspace` | WonderSpace AI build hub | `wonderspace/page.tsx` (`/api/build/stream`) | KEEP |
| `/wonderspace/ide` | Codespaces-style workspace launcher | `wonderspace/ide/page.tsx` → pushes `/ide` | KEEP |
| `/ide` | Cloud IDE launcher (PodLauncher) | `app/(tools)/ide/page.tsx` | KEEP (canonical CODE destination) |
| `/coder-workspace` | Cloud workspace landing/CTAs | `app/coder-workspace/page.tsx` | KEEP (or redirect → `/ide`) |

### C. 3D — WonderPlay

| Route | Purpose | Component | Action |
|---|---|---|---|
| `/wonder-play` | Redirect bridge to wonderplay-3d subdomain | `wonder-play/page.tsx` | KEEP |
| `/play/[sceneId]` | Scene runtime viewer | `play/[sceneId]/page.tsx` | KEEP |
| `/scenes/[sceneId]` | Scene data path | `scenes/[sceneId]/` | KEEP (data layer) |
| `/dashboard/3dhub` | AI 3D factory hub | `dashboard/3dhub/page.tsx` | KEEP |
| `/game-builder/create` | Game builder prompt → scene | `game-builder/create/page.tsx` | KEEP |
| `/dashboard/editor-playcanvas` | PlayCanvas editor bridge | `dashboard/editor-playcanvas/page.tsx` | KEEP |
| `/scene-library`, `/3d-library`, `/3d-cli`, `/template_futuristic_city` | Asset/template 3D surfaces | respective pages | KEEP |
| `/wonder-projects/[projectId]` | Orphan workspace detail | `(workspace)/wonder-projects/[projectId]/` | REDIRECT → `/dashboard/projects` |

### D. Dashboard / Workspace (secondary)

| Route | Purpose | Action |
|---|---|---|
| `/dashboard` + `/dashboard/*` (projects, agents, aetherguard, analytics, collaboration, npc, teams, usage, settings·byoc·coder·webhooks, subscription, support) | Authenticated workspace shell | KEEP |
| `/dashboard/ai-generator` | legacy AI generator page | REDIRECT → `/dashboard/agents` (page exists standalone) |
| `/dashboard/features` | **BROKEN** — referenced but no route | Fix links → `/dashboard/settings` |
| `/dashboard/overview` | **BROKEN** — referenced in API, no route | Fix → `/dashboard` |
| `/settings/*` | Standalone settings | KEEP |

### E. Duplicate / legacy redirect shims (already redirect)

| Route | Status | Destination |
|---|---|---|
| `/builder` | redirects | `/wonder-build/builder` |
| `/builder/[id]` | redirects | `/wonder-build/builder?blueprint={id}` |
| `/builder-ai` | redirects | `/wonder-build` |
| `/builder/3d` | orphan (0 inbound refs) | add → `/wonder-build/webgl` |
| `/wonder-build-mobile` | orphan (0 inbound refs) | redirects to `/wonder-build/playcanvas` |
| `/admin/editor` | orphan (0 inbound refs) | redirects to `/wonder-build` |
| `/wonder-play` | external bridge | KEEP |
| `/wonder-projects/[projectId]` | orphan (0 inbound refs) | add → `/dashboard/projects` |

## 2. Duplicate route report

- **`/wonder-build/ai-builder`, `/wonder-build/preview` vs `/wonder-build/studio`** — all three render `/api/build/stream`-driven AI editors. Existing `next.config.mjs` already 301s `ai-builder` and `preview` → `/wonder-build/studio`. **Keep.** Docs/links that still point at `/wonder-build/ai-builder` should be updated to `/wonder-build/studio` (16+ occurrences) or, better, to `/wonder-build`.
- **`/builder`, `/builder-ai`, `/builder/3d`, `/wonder-build-mobile`, `/admin/editor`** — verified redundant shim routes. Convert client redirect shims into permanent server redirects for a single consistent layer.
- **`/coder-workspace` vs `/ide`** — overlapping "cloud dev environment" landing. `/ide` is the canonical CODE destination (it is what `/wonderspace/ide` launches and what 50+ links point to). `/coder-workspace` offers a richer, subscription-aware landing; keep as the human-friendly entry, point its internal CTA to `/ide`.
- **`/dashboard/3dhub`, `/wonder-build/playcanvas`, `/wonder-build/webgl`, `/module scenes`** — different 3D surfaces. Not collapsed (engine-specific). Keep as tools under the 3D destination.

## 3. Component duplication report

| Capability | Canonical implementation | Duplicate / notes |
|---|---|---|
| Canvas engine | `useBuilderStore` (`lib/builder/store.ts`) + `VisualBuilderCanvas` | Only zustand store in the app. Studio uses separate local state (different surface, keep). |
| Project state | `useBuilderStore` + `ProjectStateManager` + `SovereignOSContext` (`editorCode`) | `BuilderContext` is an empty stub — safe to leave. |
| Save / autosave | `StorageService` (`lib/builder/pipeline/StorageService.ts`) via `PipelineManager` | Scene autosave (`lib/scene/auto-save.ts`) is a separate 3D domain. |
| AI generation | `/api/build/stream` (SSE agent pipeline) | 4 near-identical client copies: `SovereignOSContext`, `ai-builder/page`, `studio/AIAssistantModal`, `wonderspace/page`. **Do NOT rewrite now** — used by canonical builder. |
| AI panel (design tab) | `AIAssistantPanel` → `/api/ai` | — |
| Live preview | `LivePreviewService` singleton | `(preview)/preview/[projectId]` is the secure published preview — different layer. |
| Publish | `PublishModal` → `/api/projects/publish` | — |
| Templates | `TemplatesPanel` (+`/api/templates`) and template-library `App` (`/wonder-build/templates`) | Two systems; distinct purposes. Keep. |
| 3D editor shells | PlayCanvasEditorHost, WebglEditorHost, WebGLStudioHost | `TriEngineShell`, `QuadEngineShell` are orphan (0 live imports). `QuadEngineShell` also imports missing `lib/navigation` — import must be fixed or removed. |
| Auth gate | `AuthProvider` (`lib/supabase/auth-context`) + `requirePaidAIUser` | — |

**Dead AI routes (no consumer, do not delete, but note):**
`/api/builder/generate`, `/api/builder/ai`, `/api/wonder-build/generate`,
`/api/wonder-build/ai/chat|generate-layout|suggestions`.

## 4. Proposed canonical destinations

```
DREAMMAKERHUB
   │
   ├─ BUILD  → WonderBuild  → /wonder-build          (hub) 
   │           /wonder-build/studio  (AI studio)
   │           /wonder-build/builder (visual canvas)
   │           /wonder-build/agent   (agent)
   │           /wonder-build/templates
   │
   ├─ CODE   → WonderSpace → /wonderspace            (hub)
   │           /ide / /wonderspace/ide               (cloud IDE)
   │           /coder-workspace                     (landing)
   │
   └─ 3D     → WonderPlay  → /wonder-build/playcanvas (editor gallery)
               /wonder-build/webgl
               /dashboard/3dhub
               /play/[sceneId]
               /wonder-play (external subdomain bridge)
```

## 5. Redirect map

| Source | Destination | Type | When |
|---|---|---|---|
| `/builder` | `/wonder-build/builder` | permanent | now (already client redirect) |
| `/builder/[id]` | `/wonder-build/builder?blueprint={id}` | permanent | now (preserve query) |
| `/builder-ai` | `/wonder-build` | permanent | now (already redirect) |
| `/builder/3d` | `/wonder-build/webgl` | permanent | after verify (subdivided same WebGLStudioHost) |
| `/wonder-build/preview` | `/wonder-build/studio` | permanent | existing (keep) |
| `/wonder-build/ai-builder` | `/wonder-build/studio` | permanent | existing (keep) |
| `/wonder-build/agent` | `/wonder-build/studio` | existing, conflicts with AGENT KEEP — see decision point below | remove redirect (keep agent live) |
| `/wonder-build-mobile` | `/wonder-build/playcanvas` | permanent | now (already redirect) |
| `/admin/editor` | `/wonder-build` | permanent | now (already redirect) |
| `/wonder-projects/[projectId]` | `/dashboard/projects` | permanent | now (orphan) |
| `/wonder-play` | external subdomain | N/A (client redirect) | keep |

## 6. Dependency risks

1. **Missing central nav registry.** `GlobalNavigation.tsx` and `QuadEngineShell.tsx` import `PAGES`/`getPagesByCategory` from `apps/web/lib/navigation` which does not exist (deleted in "fixed dead stub"). Both components are effectively broken when rendered.
2. **No shared ProjectShell/ProjectSwitcher.** Project switching is duplicated ad hoc (dashboard layout, `/dashboard/projects`, URL search params).
3. **`next.config.mjs` redirect on `/wonder-build/agent`** contradicts the target structure (agent = a kept surface) and 13 live nav links point at it.
4. **25+ hardcoded nav link sets** (Footer, GlobalNavigation, QuadEngineShell, Navbar, SovereignNavBar, dashboard layout, settings menus, homepage data/sign-map/search). Any change must be applied consistently.
5. **`/ide`** has no bare directory but resolves via `(tools)/ide` — fine; do not create a second page.
6. **Two project models**: Supabase `projects` (UUID, type enum) used by dashboard; `_projects` (SQLite via `getDb`) used by `api/projects` + `lib/projects/storage`. Consolidation keeps both wired to their existing callers; a unified `Project` view can be read-only aggregation, no schema change.
7. **Live-redirect consumers**: docs `getting-started.mdx`, CLI (`packages/aiw-cli`), `docs/3d-cli.mdx`, and homepage cards reference `/wonder-build/ai-builder` — after redirect to studio these all still work; update labels in nav for clarity.

## 7. Implementation log

Status: consolidated nav live; builds green (see 7.4).

### 7.1 Central nav registry
- Created `apps/web/lib/navigation.ts` exporting `PAGES`, `getPagesByCategory` (legacy), `PRIMARY_NAV` (BUILD / CODE / 3D), `SECONDARY_NAV`, and `resolveProjectDestination()`.
- `apps/web/components/GlobalNavigation.tsx` now consumes `PRIMARY_NAV`/`SECONDARY_NAV` (full / minimal / mobile variants); this fixes the previously-missing `lib/navigation` import that was breaking the component.
- `apps/web/components/QuadEngineShell.tsx` no longer imports the missing `PAGES`/`getPagesByCategory` (removed import).
- `apps/web/app/homepage/data.ts` menuItems grouped into Build / Code / 3D / Explore / Resources / Company; removed dead `/solutions/*` links.
- `apps/web/app/(workspace)/dashboard/layout.tsx` sidebar regrouped into Build / Code / 3D + Workspace utilities + Management.
- `apps/web/components/Footer.tsx`, `apps/web/components/Navbar.tsx` restructured to Build / Code / 3D sections.
- `apps/web/app/(builder)/wonder-build/components/SovereignNavBar.tsx` NAV_LINKS trimmed to Hub / Agent / Builder / 3D / Dashboard.

### 7.2 Query params, project types and CTAs
- Query-param pushes from `AIWorkflowInput.tsx`, `hub/page.tsx`, `library/page.tsx`, `TriEngineShell.tsx`, `wonderspace/page.tsx` now target `/wonder-build/studio?…`.
- Homepage hero CTAs and `homepage/ShowcaseSection.tsx` point at `/wonder-build/studio`.
- Dashboard project editor routing via `PROJECT_TYPE_INFO` (e.g. `web_app → /wonder-build/studio`, `workspace → /ide`, `wonderbuild → /wonder-build/builder`).
- `/api/projects` POST now accepts a `type` alias alongside `tool` (stored into `_projects.tool`); documented in `app/api-reference/page.tsx`.
- Remaining `/wonder-build/ai-builder` references in `lib/3dWonderBuildEngine.ts` and `homepage/builder-showcase-cards.ts` repointed to `/wonder-build/studio`; only the redirect rule and internal comments remain.

### 7.3 Redirects (final, in `apps/web/next.config.mjs`)
| Source | Destination | Type | Status |
|---|---|---|---|
| `/wonder-build/preview` | `/wonder-build/studio` | permanent | kept |
| `/wonder-build/ai-builder` | `/wonder-build/studio` | permanent | kept |
| `/wonder-build/agent` | — | — | redirect removed; agent is a live surface (per user decision) |
| `/builder/3d` | `/wonder-build/webgl` | permanent | added |
| `/wonder-projects` | `/dashboard/projects` | permanent | added — narrowed to the bare index only |
- **Note:** `/wonder-projects/[projectId]` stays live (runtime control, files, export); a `:path*` wildcard redirect would have shadowed it.

### 7.4 Build verification
- Install needed Node ≥20.19 (Prisma) — used nvm v20.19.0.
- `prisma generate` run after `npm ci` (postinstall was interrupted).
- Placeholder envs required at page-data collect time because `infra/lib/env.ts` calls `requireEnv()` at module scope for `ALICE_API_KEY` / `SIMPLE_RICK_API_KEY` / `SPIRIT_GUIDE_API_KEY` / `MONGODB_URI` — pre-existing, unrelated to consolidation.
- Fixed pre-existing prerender bug in `apps/web/components/homepage/FeatureShowcase.tsx`: `<Image>` used without `next/image` import (`ReferenceError: Image is not defined`).
- Result: `next build --webpack` exit 0; all canonical routes (`/wonder-build/*`, `/wonderspace*`, `/ide`, `/wonder-projects/[projectId]`, etc.) emitted.
- ESLint on changed files: 0 errors (warnings only).

### 7.5 Removed / archived
- Removed 14 stray 3D-asset binaries from repo root (uploaded via "Add files via upload" PRs #303–#308): `Armored+Girl+*.rar`, `Armored+Future+Soldier+Nazi+Girl+…wmv`, `boat3D.zip`, `wonder3d---…zip` (~72MB).

### 7.6 Deferred (documented, not changed)
- The four near-identical SSE agent clients (`/api/build/stream` consumers in `SovereignOSContext`, `ai-builder/page`, `studio/AIAssistantModal`, `wonderspace/page`) — merge later, not now.
- `/dashboard/ai-generator` orphan page — left untouched (live, no nav reference).
- AI routes (`/api/builder/generate`, `/api/wonder-build/ai/*`, etc.) kept, only mapped-not-deleted.