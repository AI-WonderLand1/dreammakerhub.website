# Engine & Tool Runtime Contract (Mandatory)

This contract is mandatory for AI agents and human contributors adding or changing engines/tools in this monorepo.

## Platform separation

1. **Puck in `apps/web` for high-level page layouts**.
2. **PlayCanvas and engine-specific editor/runtime logic in `packages/unreal-wonder-build`**.
3. **Do not bundle PlayCanvas inside Puck**. They must be sibling surfaces in `apps/web` routes.
4. **WonderSpace/Theia remains standalone**. `apps/web` connects through iFrame or socket APIs only; never import Theia UI components directly into `apps/web`.

## Trust Layer runtime states (required)

Every new engine or tool integration must implement all 3 user-visible states:

- **Skeleton (Loading)**
- **Empty State (with CTA)**
- **Error Toast or Alert (Graceful Failure)**

If any state is missing, the change fails CI.

## Header contract for pages

Every touched page must include this sequence:

- **Breadcrumb/Back**
- **Title**
- **Subtitle**
- **Primary Action**

## CI gate

Add/maintain Vitest coverage that verifies:

- Route links point to existing pages or rewrites.
- Engine/tool implementations include the mandatory trust states.
- Separation boundaries remain intact (Puck route does not import PlayCanvas runtime directly).
