# WonderBuild Pages — Small Safe Slice

## Scope

Website builder only. Do not change WonderPlay, NPC-AI-SIM, PlayCanvas/game routes, scene tooling, or dedicated 3D runtime systems.

This slice intentionally stops at the Pages data-model boundary. It does **not** add CMS, Assets, Components, publishing changes, or a large editor rewrite.

## What the code currently does

### Builder state is single-page

`apps/web/lib/builder/types.ts` defines `BuilderState` around one `elements: CanvasElement[]` tree. There is no site/page abstraction, page id, page slug, or active page in the visual-builder state.

### Persistence is single-page

`apps/web/lib/builder/pipeline/StorageService.ts` persists one visual snapshot to `builder-state.json`:

- `elements`
- `theme`
- `activeBreakpoint`
- `zoom`
- `pan`
- `showGrid`
- `snapToGrid`

The same snapshot shape is used for project loads and revisions.

### Existing `/api/pages` is not the WonderBuild site-page model

`apps/web/app/api/pages/route.ts` stores user-level records in the `pages` table using fields such as `user_id`, `title`, `slug`, `body_html`, `cover_image_url`, `content`, and `published`.

The public route `apps/web/app/(public)/[slug]/page.tsx` renders those records as standalone published HTML/article-style pages.

That API is **not project-scoped** and does not store a WonderBuild `CanvasElement[]` document per website project. Reusing it for the visual editor would mix two different page concepts and create another architecture split.

### Project file storage can support a page model

`apps/web/app/api/projects/[projectId]/files/route.ts` already reads/writes arbitrary project files, so Pages can remain inside the existing project persistence boundary without introducing a second database system in the first implementation.

## Smallest safe model

Keep `builder-state.json` as the canonical WonderBuild project snapshot, but evolve it compatibly.

```ts
export interface SitePage {
  id: string;
  name: string;
  slug: string;
  elements: CanvasElement[];
}

export interface WonderBuildSiteState {
  version: 2;
  pages: SitePage[];
  activePageId: string;

  // Existing project-wide visual settings remain project-wide.
  theme: BuilderTheme;
  activeBreakpoint: Breakpoint;
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  snapToGrid: boolean;

  // Temporary compatibility mirror while old consumers still expect it.
  elements: CanvasElement[];
}
```

### Why keep the top-level `elements` temporarily

Several existing systems already expect `builder-state.json.elements`. Removing it immediately would force StorageService, validation, template seeding, generated project files, revisions, preview/publish paths, and other consumers to change in one pass.

During migration, `elements` should mirror the active page's elements. That allows Pages to be introduced without breaking the current renderer and pipeline.

## Backward compatibility rule

When loading an existing version-1 project:

```ts
if (!state.pages && Array.isArray(state.elements)) {
  state.pages = [
    {
      id: 'home',
      name: 'Home',
      slug: '/',
      elements: state.elements,
    },
  ];
  state.activePageId = 'home';
}
```

Do not rewrite old projects until they are successfully loaded. The first save after migration can persist version 2.

## Page rules for the first implementation

Keep the first UI deliberately small:

1. Every WonderBuild project has at least one page: **Home**.
2. Home slug is `/`.
3. New pages get a stable generated id and a normalized slug.
4. Switching pages saves the current page's `elements`, then loads the selected page's `elements` into the existing canvas store.
5. Renaming a page does not silently change its slug after initial creation.
6. Do not allow deleting the last remaining page.
7. Selecting a new page clears `selectedId` and should reset page-local edit history rather than carrying element selection/history across pages.
8. Theme and responsive canvas controls remain project-wide for this first slice.

## Explicitly not in this slice

- CMS collections/posts
- navigation-menu auto-generation
- nested page folders
- password-protected pages
- localization
- per-page SEO editor
- custom domains
- component/global-section system
- image or 3D asset pipeline
- C++/WebAssembly
- WonderPlay/NPC/scene changes

## Next coding slice

Only after this model is accepted:

1. Add `SitePage` / page-state types.
2. Add backward-compatible page fields to the builder store and StorageService.
3. Preserve top-level `elements` as an active-page compatibility mirror.
4. Add unit-level helpers for create/switch/rename/delete-page behavior.
5. Run CI and compare failures with the current `Master` baseline.
6. **Then** add the minimal Pages panel UI in a separate pass.

This ordering keeps the visual UI from being built on a page model that does not yet persist correctly.
