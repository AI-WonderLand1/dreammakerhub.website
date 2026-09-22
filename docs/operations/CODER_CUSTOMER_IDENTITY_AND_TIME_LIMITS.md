# Customer IDE identities and time limits

Status: **NOT ENABLED**. This is an implementation and verification contract, not a claim that customer IDEs or time quotas currently work. Keep both operator switches off until the controls below are deployed and tested. The fail-closed customer gate in `workspace-slots.server.ts` is deliberately independent of those switches.

## Existing identity, no new user IDs

- `auth.users.id` is the existing unique Supabase Auth UUID for each registered user. The server must obtain it via `supabase.auth.getUser()`, not a browser-provided ID, email, username, or editable profile. Supabase Auth owns login/password hashing/sessions/access and refresh tokens/password resets. Never copy an encrypted password or session token to Coder or application tables.
- `public.profiles.id` references that same `auth.users.id`. It is display/profile data, not a second authentication identity and not the IDE authorization credential.
- `public.coder_workspace_slots.user_id` already references `auth.users(id)` and is only accessible with the service role. It maps an authenticated Supabase user to a Coder workspace **ID** after Coder confirms creation. The website must check this mapping for every view, open, start, stop, and delete operation. A random UUID alone does not grant access.
- The existing Coder API wrapper POSTs to `/api/v2/users/${CODER_WORKSPACE_OWNER || 'me'}/workspaces`. A UUID in Supabase does NOT turn that shared Coder owner into separate accounts. The personal `wonderingtribe/production` workspace must never be returned to, shared with, or reused for any customer. Do not set `CODER_WORKSPACE_OWNER` to a customer-supplied value or create all customer IDEs under the operator token.

## Work needed for private customer IDEs

1. Configure and test a supported Coder identity federation or verified provisioning integration that creates/links a distinct **Coder user ID** for each verified Supabase Auth UUID. Do not assume that matching UUID strings across products establishes an authenticated Coder session. Use a dedicated, least-privileged server integration credential, not the operator's browser session or Git SSH key.
2. Verify customer A can access only customer A's Coder owner workspace, private app, ports, terminal, SSH, and files; customer B and anonymous users receive 403/404. Test with separate browsers AND direct Coder URLs and APIs, not just website route filters. Keep template edit/publish and administrator roles restricted to the operator. Do not allow customer-supplied owner or workspace IDs to bypass the `coder_workspace_slots.user_id` lookup.
3. Provision separate bounded Kubernetes pods and persistent volumes, with namespace quotas and service-account RBAC. Keep the existing operator pod and PVC outside customer workflows. Test deletion, suspension and backup before enabling new customer pods.

## Actual time usage, not just idle autostop

The current `CODER_TTL_MS = 60 * 60 * 1000` is passed to Coder on creation, but Coder's default autostop is inactivity-based and can be extended by activity. **It is not a per-user amount of time spent.** Limits on workspace count, CPU and disk are also not time allowances.

Before enabling customers, the operator must choose whether allowance means *active editing time* or the more conservative *running compute time*; choose a numeric amount and renewal window (e.g. minutes/day or hours/month). Do not invent the plan rules or let customers edit them. The initial safe implementation should meter **running compute time**, since an open pod incurs costs even without editor interaction. A separate usage event stream can report actual editor activity later, but it must not be used as the only cost meter.

The implementation must persist an atomic ledger keyed by authenticated Supabase UUID and an immutable Coder workspace ID; account for all starts, stops, restarts, disconnects, and multiple tabs. A server-side scheduled reconciler must obtain authoritative Coder workspace state, debit elapsed running time even if the browser closes, enforce remaining allowance BEFORE every workspace start, and request Coder to stop the workspace when its allowance expires. It must verify the workspace has actually stopped, retry/report failures, and fail closed on accounting or Coder API outages. Also enforce Coder template scheduling/permissions so direct Coder UI/CLI access cannot restart, extend the TTL or keep consuming compute after the website's meter says zero. Existing pods and their disk costs must be accounted for separately. A client-side countdown alone is not enforcement.

Do not enable `BILLABLE_OPERATIONS_ENABLED` or `CODER_WORKSPACE_CREATION_ENABLED` for customers until the actual Coder backend token is accepted, separate identities and private apps work, the meter and hard stop are deployed and tested, provider cost caps are acceptable, and two-user isolation tests pass. Updating GitHub Actions variables is not proof that the running UpCloud container has picked them up; verify deployment separately. No migration or live Coder configuration is applied by this document.
