# WonderSpace consolidation: Coder + Supabase

Decision: DreamMakerHub is the customer-facing dashboard, Supabase provides identity/project records, **Coder is the only customer workspace orchestrator**, and code-server provides the VS Code-style browser editor. The execution backend for customer Coder workspaces still requires an explicit, cost-reviewed deployment decision. Do not silently switch to AWS, add Railway projects or assume that existing operator infrastructure can host customers.

## Changes in this cleanup

- The primary `/wonderspace` page no longer probes or advertises the un-deployed Railway Sandbox customer runtime.
- Old `/wonderspace/on-demand` bookmarks go back to the primary WonderSpace page.
- The customer view clearly presents the existing browser project file editor as a separate, limited fallback; it does **not** claim that the full customer VS Code runtime is ready.
- Existing personal/operator Coder access stays untouched.

## Preserve for now — no destructive deletions

- Main Railway project `lucid-integrity`, main website, operator-only `WonderSpace-IDE` and its 5 GB volume.
- Supabase Auth, `_projects`, `_project_files`, Coder metadata tables, and all user data.
- Existing customer Coder security gates, runner implementation and test suites.
- Dormant Railway Sandbox controller, gateway, migrations and tests in Git for rollback; their customer UI is retired, but the server API remains gated, not promoted as active.
- The separately created empty Railway project `wonderspace-customer-sandboxes` until deletion and external references are independently approved.
- Railway Postgres until its dependencies/data are assessed; it must not be assumed equivalent to Supabase.

## Only supported target path

1. Customer signs into DreamMakerHub with Supabase.
2. DreamMakerHub verifies the user's distinct Coder identity and project/workspace ownership.
3. Coder creates and manages a workspace on **one explicitly selected, isolated compute backend**, never on the personal operator instance.
4. A DreamMakerHub-owned, WebSocket-capable gateway opens **only that customer's code-server app**, not the Coder dashboard or operator token.
5. Customer files persist on dedicated private storage; independent runtime cutoff and quota enforcement stop billable work when allowance runs out.

## Blockers that prevent enabling provisioning today

- A verified customer-specific Coder template/compute provider and two genuine customer OIDC identities are not established as production-ready.
- The customer-only VS Code gateway is not deployed and independently tested for cross-user isolation.
- Independent billing hard-stop and tested storage/restore requirements are outstanding.

**Keep provisioning disabled until all the above are verified.** Do not represent the existing AI-assisted `/api/wonderspace/terminal` route as real Linux execution; it generates an AI answer, not shell output.

## Explicit later cleanup, after the chosen backend works

- Retire old customer EKS/Kubernetes provisioning files and deployment workflows only when repo references and existing resources have been checked.
- Delete dormant Railway Sandbox code, related settings and empty Railway project only after confirming there are no backups, external automation hooks or billing dependencies.
- Remove obsolete environment variables and any unused credentials after dependency tracing, with token rotation where appropriate.
- Verify two-customer create/open/terminal/file isolation, stop/restart persistence, and monthly-cost cutoff before enabling the launch button.
