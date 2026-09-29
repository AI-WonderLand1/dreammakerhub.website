# WonderSpace native customer Sandbox controller — restricted pilot

**Status:** fail-closed until production secrets, a verified checkpoint, real
two-customer isolation checks, measured Railway usage, and safe restore tests
have completed. This service does not connect to the operator's IDE.

Proposed location: the **existing** Railway project `lucid-integrity`,
but in a **separate empty environment** such as `customer-ide-test`, never
inside the production environment that hosts the website and database.
Railway Sandbox public domains currently require `networkIsolation: "PRIVATE"`,
which otherwise permits customer VMs to contact other services on that
environment's private network. Separate environments create the needed
network boundary; do not copy production services or their secrets into the
customer sandbox environment.

This is a deployment plan only: do not create any service, environment, or
billable sandbox without separate operator approval. If approved, create ONE
isolated controller service there, not another shared IDE or another project.
Connect the existing repository on `Master`, service root
`/infra/wonderspace/customer-controller`, one replica. Its public HTTPS
Railway domain is used only by the website's authenticated server proxy.
Never use the operator's `ide.dreammakerhub.website` hostname.
Actual two-user isolation, gateway authentication and independently enforced
cost cutoff must pass before public provisioning.

**Private Railway variables (do not paste these into GitHub or chat):**
- `SUPABASE_URL` — existing DreamMakerHub Supabase project URL.
- `SUPABASE_PUBLISHABLE_KEY` — project public publishable key.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only secret with access to project
  storage/ledger. Only on the approved controller service. Never in a sandbox.
- `RAILWAY_TOKEN` — **scoped project token** for ONLY the separately approved sandbox environment. The controller rejects broader `RAILWAY_API_TOKEN` fallback. Never put either token into a customer VM.
- `RAILWAY_ENVIRONMENT_ID` — Railway automatically injects it into the
  deployed controller. For a local smoke test, supply the approved environment's
  test environment ID privately.
- `WONDERSPACE_GATEWAY_MASTER_SECRET` — random `openssl rand -hex 32`,
  generated privately and NEVER inherited by customer VMs. Each VM gets a
  unique short-lived derived gateway key.
- `WONDERSPACE_CUSTOMER_RUNTIME_ENABLED` — `false` until the test
  checkpoint and cost gates have passed.
- `WONDERSPACE_CUSTOMER_ISOLATED_ENVIRONMENT_ID` — exactly the Railway-generated
  ID of the separately approved empty sandbox environment.
- `WONDERSPACE_PRIVATE_NETWORK_REVIEWED` — leave unset until you've
  verified the sandbox environment does not contain production services,
  database replicas, production secrets or the shared operator IDE; set to
  `true` only after reviewing that isolation. Boot rejects an enabled
  customer runtime in an environment called production, with an unexpected
  environment ID, or with an unreviewed private network.
- `WONDERSPACE_TESTER_USER_IDS` — two **distinct** verified non-operator
  Supabase test accounts, configured directly on the isolated controller.
  No account IDs need to be sent through chat.
- `WONDERSPACE_MONTHLY_RESERVED_MINUTES` — test limit `30` initially.
  This is **not** an account-wide Railway billing ceiling.

The existing website service additionally needs:
- `WONDERSPACE_CONTROLLER_URL` — exact HTTPS Railway domain of this
  isolated controller, for server-side proxy calls only.
- `WONDERSPACE_CUSTOMER_RUNTIME_ENABLED` — `true` *after* tests.
- `NEXT_PUBLIC_WONDERSPACE_SANDBOX_UI_ENABLED` — `true` *last*, once
  two-user auth/terminal isolation and actual spend have been validated.

**Bootstrapping** (after explicit spend and deployment approval): in the approved Railway
project/environment, prepare the clean checkpoint and run the existing
`../railway-sandboxes/scripts/checkpoint-gzip-roundtrip.mjs` test.
The checkpoint scripts require `CONFIRM_BILLABLE_SANDBOX_TEST=YES` and a
privately configured environment-scoped project token; tokens may not appear in CI logs.

**Data boundary:** the no-VM browser editor already saves owner-verified
editable files in the existing Supabase `_projects` and `_project_files` tables.
The controller separately saves per-sandbox gzip archives in private Supabase
Storage. Those files are **not currently synchronized**. Do not promise shared
editing between the browser editor and customer Linux VMs until the bridge is
implemented and ownership, conflicts and restore are tested.

The controller uses an atomic service-role RPC to reserve 15 minutes for a
10-minute VM session, with a single global concurrent VM. It verifies each
Supabase JWT independently and only allows approved tester IDs; no raw
customer GitHub tokens or third-party repository URLs are accepted.
The private gzip bucket has no client RLS policies. Every save is a new
immutable private archive and its SHA-256 hash is committed before the VM
is destroyed. The service retains two committed gzip generations to bound
storage. An intentional stop also attempts a **private per-workspace whole-disk
Railway checkpoint**, preserving installed tools and IDE extensions; a later
start restores that checkpoint when available, otherwise falls back to the
latest integrity-checked portable gzip and clean golden IDE. The controller retries failed saves, and blocks starting an
unknown or failed VM until reconciled.

**Important limitation:** autosaving does not preserve unsaved editor tabs or
background programs. Portable gzip contains project files only. A successful
whole-disk Railway checkpoint may retain user-installed tools and extensions,
but it is best-effort and limited by the plan's checkpoint quota. Restoration
from portable gzip after checkpoint unavailability starts from the clean IDE
without user-installed operating-system packages. These limitations must be
shown to customers before general release.
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
