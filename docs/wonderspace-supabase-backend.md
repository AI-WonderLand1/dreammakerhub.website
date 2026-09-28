# WonderSpace backend: reuse the existing infrastructure

**Deployment decision:** the original Railway `lucid-integrity` project and
DreamMakerHub Supabase project remain the infrastructure owners. This PR does
not create any service, environment, VM, token, checkpoint or deployment.

| Responsibility | Location | Status |
| --- | --- | --- |
| Customer identities | Existing Supabase Auth | Existing |
| Browser project metadata | Supabase `_projects` | Existing |
| Browser editable text files | Supabase `_project_files`, via owner-checked project API | Existing |
| Browser IDE file manager | `/wonderspace/browser` → `/dashboard/projects/[id]/files` | Existing; this PR repairs auth for reads/writes and ZIP downloads |
| Customer VM gzip backups | Existing private Supabase Storage bucket `wonderspace-customer-snapshots` | In code, not live-tested |
| On-demand Linux terminal | Railway native Sandbox behind a customer controller | In code, disabled |
| Operator personal code-server | Existing Railway `WonderSpace-IDE` service and private volume | Separate; never give to customers |
| Version control | Authorized customer GitHub integration | Separate from Supabase project files |

For the **browser IDE**, the existing project API checks the Supabase user
and the project owner before every file operation. The UI obtains the current
Supabase access token for each same-origin request so editing remains possible
when reverse proxies omit SSR cookies. It falls back to normal SSR cookies
when no browser token is available. No service-role secrets run in the browser.

## What remains intentionally disabled

The customer Linux runtime is a separate, restricted pilot. Do not enable
`WONDERSPACE_CUSTOMER_RUNTIME_ENABLED` or
`NEXT_PUBLIC_WONDERSPACE_SANDBOX_UI_ENABLED` just because this PR merges.
With separate explicit approval, its controller could run as a new service
**inside the original Railway project**, subject to a project-token scope and
isolation review. Never reuse the existing operator code-server for customers.

**Existing limitation:** the browser editor's live files are in Supabase
Postgres, but the Linux controller's private gzip backups are separately
stored in Supabase Storage. These two stores do **not** automatically sync.
Before advertising a seamless experience: owner-bind each Linux workspace to
a real DreamMakerHub project; add authenticated file import/export with
conflict handling; verify snapshots, restoration, two-account isolation and
measured spend; then enable the gates in that order.

## Verification

- Browser user with cookies can list, edit, rename, delete, import and export.
- Browser user with valid Supabase token but missing SSR cookies can do the same.
- A second account cannot fetch or mutate another owner's project files.
- Token refresh while the editor is open still allows saves.
- The private operator IDE, its disk and secrets remain inaccessible.
- No new project, environment or service is created by this PR.
