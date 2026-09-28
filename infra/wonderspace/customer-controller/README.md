# WonderSpace native customer Sandbox controller — restricted pilot

**Status:** fail-closed until production secrets, a verified checkpoint, real
two-customer isolation checks, measured Railway usage, and safe restore tests
have completed. This service does not connect to the operator's IDE.

Railway project: `wonderspace-customer-sandboxes` (dedicated private project).
Connect the confirmed `AI-WonderLand1/dreammakerhub.website` GitHub repository
on `Master`, root `/infra/wonderspace/customer-controller`, with
`infra/wonderspace/customer-controller/railway.toml`. Use one replica.
The controller needs a generated HTTPS public hostname. Never use the
operator's `ide.dreammakerhub.website` hostname.

**Private Railway variables (do not paste these into GitHub or chat):**
- `SUPABASE_URL` — existing DreamMakerHub Supabase project URL.
- `SUPABASE_PUBLISHABLE_KEY` — project public publishable key.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only secret with access to project
  storage/ledger. Only on this dedicated controller. Never in a sandbox.
- `RAILWAY_API_TOKEN` — an appropriate token with access to this *isolated
  sandbox project*. Use the narrowest available scope; keep private.
- `RAILWAY_ENVIRONMENT_ID` — Railway automatically injects it into the
  deployed controller. For a local smoke test, supply the dedicated project's
  test environment ID privately.
- `WONDERSPACE_GATEWAY_MASTER_SECRET` — random `openssl rand -hex 32`,
  generated privately and NEVER inherited by customer VMs. Each VM gets a
  unique short-lived derived gateway key.
- `WONDERSPACE_CUSTOMER_RUNTIME_ENABLED` — `false` until the test
  checkpoint and cost gates have passed.
- `WONDERSPACE_TESTER_USER_IDS` — comma-separated verified Supabase
  auth.user UUIDs (two distinct non-operator test accounts).
- `WONDERSPACE_MONTHLY_RESERVED_MINUTES` — test limit `30` initially.
  This is **not** an account-wide Railway billing ceiling.

The existing website service additionally needs:
- `WONDERSPACE_CONTROLLER_URL` — exact HTTPS Railway domain of this
  isolated controller, for server-side proxy calls only.
- `WONDERSPACE_CUSTOMER_RUNTIME_ENABLED` — `true` *after* tests.
- `NEXT_PUBLIC_WONDERSPACE_SANDBOX_UI_ENABLED` — `true` *last*, once
  two-user auth/terminal isolation and actual spend have been validated.

**Bootstrapping** (after explicit spend approval): in the dedicated Railway
project/environment, prepare the clean checkpoint and run the existing
`../railway-sandboxes/scripts/checkpoint-gzip-roundtrip.mjs` test.
The checkpoint scripts require `CONFIRM_BILLABLE_SANDBOX_TEST=YES` and a
privately configured account/workspace token; tokens may not appear in CI logs.

The controller uses an atomic service-role RPC to reserve 15 minutes for a
10-minute VM session, with a single global concurrent VM. It verifies each
Supabase JWT independently and only allows approved tester IDs; no raw
customer GitHub tokens or third-party repository URLs are accepted.
The private gzip bucket has no client RLS policies. Every save is a new
immutable private archive and its SHA-256 hash is committed before the VM
is destroyed. The controller retries failed saves, and blocks starting an
unknown or failed VM until reconciled.

**Important limitation:** autosaving does not preserve unsaved editor tabs,
background programs or operating-system packages installed outside the
customer project. Customer-specific whole-disk checkpoints are a separate
feature requiring storage/privacy review before they can be enabled.
If the controller is down long enough for Railway itself to delete a VM,
edits since the last completed gzip autosave can be lost.

**Budget:** Hobby sandbox VM CPU and memory are metered separately from
regular Railway containers and count toward the SAME included allowance.
A reservation is an application throttle, not a financial cap: independently
verify actual current Railway usage and configure its account-level cost
controls before any live user provisioning. A hard spending stop may also
take the website offline. Do not enable unbounded workloads.

References:
- https://docs.railway.com/sandboxes
- https://docs.railway.com/pricing/plans
