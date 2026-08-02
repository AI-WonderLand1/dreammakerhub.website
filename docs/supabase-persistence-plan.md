# WonderBuild Persistence — Supabase + Revisions Plan

## Status
- **Implemented & committed.** Local commits `1a054d63` (renderer/typing fixes) + `7a693c5c` (full-state snapshots + revisions).
- **Pushes blocked** — no git credentials in this sandbox (askpass `ECONNREFUSED`, no SSH keys). You must `git push`.

## Architecture reality (verified, read-only)
`@supabase/supabase-js` + `@supabase/ssr` are installed. But the WonderBuild WP editor is **not** Gutenberg: `app/api/projects/[projectId]/files/route.ts` is an auth-gated (Supabase JWT via `lib/auth.ts requireUserId`) Postgres API backed by `lib/projects/storage.ts` (uses `pg` Pool from `lib/db`, tables `_projects` / `_project_files`). No `@wordpress/*` anywhere.

Auth flow: `requireUserId(req)` (in `lib/auth.ts`) extracts JWT from `Authorization` header or the `sb-…-auth-token=` cookie, verifies with `supabase.auth.getUser()`. `app/api/ai/auth.ts requirePaidAIUser` wraps that for Next.js routes.

## What was already committed (HEAD f063c6e6 "Wired UI Blocks")
- Block catalog auto-split into `apps/web/lib/builder/blocks/*.ts` (225 blocks; NOT 214 — verified line-exact vs the session-start array).
- Renderer switch auto-split into `apps/web/lib/builder/renderers/*.tsx` (130 case labels → 130 per-label entries, alias map applied).
- `ComponentLibrary.tsx` slim (imports `BLOCKS, BLOCK_CATEGORIES` from `../blocks`).
- `VisualBuilderCanvas.tsx` slim (switch → `renderers/index.tsx`).

## What THIS work added
1. **Full visual-state snapshot** (`StorageService.ts`): `saveToProject` now persists `{elements, theme, activeBreakpoint, zoom, pan, showGrid, snapToGrid}` (was `elements` only) to `/files`, key `builder-state.json`.
2. **2s debounced DB save** (was 500ms localStorage-only): `scheduleProjectSave` uses `_projectSaves` DB write every 2s on `PROJECT_STATE_CHANGED` (local save remains 500ms localStorage).
3. **Revisions** (`lib/projects/storage.ts` + `api/projects/[projectId]/revisions/route.ts`):
   - table `_project_revisions` (id, project_id, owner_id, version_number UNIQUE, snapshot JSONB, label, created_at, ON CONFLICT version).
   - `createRevision` (tx: version=max+1 → insert → `prune_revisions(owner, project, 50) → `listRevisions`, `restoreRevision`, wired via the pipeline tx.

4. **`prune_revisions` function** and a "Save Revision" toolbar button in `builder/page.tsx`.

## File map
- `apps/web/lib/projects/storage.ts` — table + `createRevision`/`listRevisions`/`restoreRevision` (auth via `owner_id`).
- `apps/web/app/api/projects/[projectId]/revisions/route.ts` — new route (GET/POST/PUT), identical auth pattern to sibling `files/route.ts`.
- `apps/web/lib/builder/pipeline/StorageService.ts` — full-state snapshot, 2s debounce, revisions client calls, `projectSaveTimer`.
- `apps/web/lib/builder/pipeline/types.ts` — widened `STORAGE_SAVED` (`revision?: boolean`) / `STORAGE_LOADED` payload.
- `apps/web/app/(builder)/wonder-build/builder/page.tsx` — "💾 Rev" Save Revision button + `showToast` feedback.

## Verification
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **exit 2**, 537 total errors (baseline committed HEAD also fails at ~543 due to `@/app/api/ai/auth` module-resolution quirk shared by 17 sibling routes + pre-existing `engine/core/projects` + `supabase-store`; **0 new errors** in any file we own; our `revision/route.ts` matches the identical `@/app/api/ai/auth` pattern in `files/route`.
- `npx eslint` on changed files: **0 errors** (warnings only: `any` on snapshot JSONB + unused legacy stubs already present in `storage.ts`; the one `HISTORY_CLEAR: {}` error is pre-existing on HEAD).

## Run book for reviewer
1. `npm install` (Supabase + pg already in `apps/web/package.json`).
2. `npx tsc --noEmit -p apps/web/tsconfig.json` (expect 537; no new errors in changed files).
3. Seed the tables manually in the DB (or they auto-create via `ensureTables()` on first touch):
   ```sql
   CREATE TABLE IF NOT EXISTS _project_revisions (
     id TEXT PRIMARY KEY,
     project_id TEXT NOT NULL,
     owner_id TEXT NOT NULL,
     version_number INT NOT NULL,
     snapshot JSONB NOT NULL,
     label TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE (project_id, version_number)
   );
   CREATE INDEX idx_pr ON _project_revisions (project_id, created_at DESC);
   CREATE INDEX idx_vr ON _project_revisions (project_id, version_number DESC);
   ```
4. `npm run dev` → open WonderBuild (url has `?projectId=..`) → build something → Ctrl+S (or 2s idle) auto-saves; click **💾 Rev** → revision POST → verify `revision` count; hit `/api/projects/[id]/revisions` to list.
