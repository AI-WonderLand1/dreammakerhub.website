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
