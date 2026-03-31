# Builder access + MegaProvider replacement recommendations

## Why the builder page can fail to load

1. **Project creation response shape mismatch**
   * `useProjectHydration` calls `createProject()` and then expects `created.id`. However, the `/api/projects` route returns `{ project }`, not a raw project object. This means `created.id` is `undefined`, so the builder never sets a valid `projectId` and subsequent data fetches can break. Recommendation: either return the project directly from the API route or update `createProject()` to unwrap the response before returning it. This is a likely blocker because the builder bootstraps itself on a valid `projectId`.

2. **Unauthorized project creation**
   * The `/api/projects` route requires either a Supabase session or a smoke auth cookie. If you access `/wonder-build` while unauthenticated, `createProject()` will return `401` and the hydration hook will log an error. Recommendation: confirm the login flow sets `sb-access-token` and `sb-refresh-token` cookies and that the user is redirected to `/wonder-build` after login.

3. **Server-side Supabase env mismatch**
   * The server client in `app/utils/supabase/server.ts` uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, while much of the rest of the app expects `NEXT_PUBLIC_SUPABASE_URL`. If only the NEXT_PUBLIC variables are set, the server client throws and `/api/projects` fails. Recommendation: ensure server envs include `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, or update the server helper to fall back to `NEXT_PUBLIC_SUPABASE_URL` for consistency.

## Replacing MegaProvider with Supabase storage (recommendations)

1. **Swap the export route snapshot storage dependency**
   * `apps/web/app/api/projects/[projectId]/export/route.ts` still imports `MegaProvider` for snapshots. Replace this by using `infra/services/storage/SupabaseProvider` (or adding a thin adapter) so snapshots are fetched from the same Supabase storage bucket as other project assets.

2. **Align storage buckets/paths**
   * The Supabase provider expects a `projects` bucket. Ensure snapshot paths are stored under a clear prefix like `projects/{projectId}/snapshots/` so the export code can list and read from a predictable folder.

3. **Standardize storage interfaces**
   * If there are other MegaProvider references, create a shared storage interface (list, read/download, upload, remove) and map Supabase to it. This keeps your replacement minimal and reduces per-route changes.

## Suggested validation steps (no changes required yet)

* Verify the `/api/projects` response payload in a local log or test environment to confirm whether `projectId` is missing due to the response shape.
* Confirm the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars are set in the server runtime.
* Search for any remaining `MegaProvider` imports and list where they appear so you can replace them methodically.
