# WonderSpace source hosting: DreamMakerHub is the home, not GitHub

## Customer workflow

1. Sign in once with DreamMakerHub's existing Supabase Auth.
2. Choose or create a project from the dashboard. The editor banner and repository navigation use **the same selected project ID**.
3. Open **Code** to use the existing Supabase-backed file manager and code editor, with no VM required.
4. Use **Issues**, **Discussions** and **Wiki**. The first-party routes persist under this same project's owner-scoped storage.
5. Use **Agents**, **Security & quality**, **Usage & insights**, **Settings** and **Projects** through existing DreamMakerHub routes.

The native dashboard does not request a GitHub account or token. The optional historical GitHub-connection backend is not used in WonderSpace navigation. External import/export, if reintroduced, must remain optional and explicitly authorized.

## Shipped in this change

- Native horizontal navigation replaces GitHub-owned Issues, Pull Requests, Discussions, Actions and Wiki links. No GitHub destination appears in repository tabs.
- Issues and private discussions use `/api/projects/[projectId]/work-items` for creation, listing, comments, and close/reopen.
- Private Markdown wiki uses `/api/projects/[projectId]/wiki` for read/save.
- The existing project API validates the DreamMakerHub user's session; project storage checks ownership before reading/writing.
- New items are written to distinct `.wonderspace/work-items/{kind}/{id}.json` records, not one shared JSON list. The wiki is `.wonderspace/wiki/home.md`; general editor list/write/delete APIs hide or refuse internal paths, preventing accidental corruption.
- No database migration, additional VM, new service, new repository provider or billable customer pod required. This first cut is explicitly **owner-only**, not cross-team collaborative.

## Not yet implemented — do not mislabel as working

- **Native Git hosting / branches / commits / clone/push/pull**: a real Git protocol service, per-tenant repositories and durable commit storage require a separate architecture and security rollout. Browser file storage and backup snapshots are not substitutes for native Git object storage.
- **Pull requests and code reviews**: disabled until native branches and diffs exist. Avoid sending the user to GitHub for these tabs.
- **Actions / CI**: disabled until user-scoped sandbox runners, permission-scoped secrets and usage cutoffs are verified.
- **Multi-user issue/discussion collaboration**: this initial implementation is private to the project owner. Team collaboration requires membership-based RLS and concurrency-safe relational issue/comment tables.
- **Linux IDE synchronization**: the cloud VM pilot remains separate. A future filesystem sync layer must preserve ownership, handle conflicts and enforce resource limits before promising seamless editor/pod interoperability.

## Native implementation follow-up

Use the existing first-party project identity and Supabase session across browser IDE and the future source-control service. Introduce private repository namespaces (project ID / tenant ID), write-safe Git object storage, branch protection, review records and signed CI webhooks only after isolation and billing tests pass. Avoid dual, incompatible sources of truth or new infrastructure until the existing storage schema and target backend are verified. Keep exports portable so users own their code.

## Native source-history backend (next phase)

The one-screen Code + History workflow now has a dedicated database foundation,
not GitHub and not the generic builder undo-revisions table:

- Dashboard: select/create a DreamMakerHub project, edit and **save** its text
  files, then press **Save version**. Versions are manually triggered and never
  generate a save dialog every few seconds. The same History panel is in the
  full-page browser editor.
- API: `/api/projects/[projectId]/source-history` lists owner-scoped version
  metadata, captures an atomic server-side source checkpoint, compares saved
  file **paths** against the current working tree and exports any checkpoint
  as a portable ZIP. It never accepts a client-supplied source snapshot.
- Database: `public._project_source_versions` in the **existing** Supabase
  project, with SELECT-only owner RLS and the authenticated,
  explicitly owner-checked `capture_project_source_version` RPC. Clients
  cannot forge or insert versions directly. Project-scoped transaction locks
  prevent two concurrent checkpoint requests from colliding on the version
  sequence. History survives browser and app restarts.
- Initial quotas: 50 manually named checkpoints per project, at most 200 text
  files, 256 KiB per file and 1 MiB per checkpoint. Reaching quota returns a
  clear error rather than deleting customer code or silent history pruning.
- Browser project files continue to live in `_project_files`; historical
  copies in `_project_source_versions` are read-only. `.wonderspace` internal
  metadata is excluded from source snapshots and downloadable archives.
- More project tools are collapsed behind one **More tools** button by default.
  Native PR and Actions tabs remain disabled instead of pretending that an
  execution/clone backend already exists.

### Important limits before calling this a GitHub replacement

**Version checkpoints are not Git commits.** This phase does not implement
Git smart HTTP, native clone/push/pull, branch checkouts, pull request merge
algorithms or CI workers. It does not run customer-provided code or enable
billable cloud workspaces. Versions can be compared by filename and
downloaded; atomic replacement/rollback of live project files has been
intentionally deferred until a transactional restore routine protects
unsaved/concurrent edits. Linux IDE filesystem synchronization is also
not yet automatic.

Full Git compatibility and customer CI must undergo a separate isolation,
durability, resource-usage and secrets-access review. Those capabilities
should reuse the current project identity and existing infrastructure rather
than exposing the operator's IDE or creating unapproved services.
