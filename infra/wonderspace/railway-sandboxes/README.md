# WonderSpace: one isolated IDE per customer, started from snapshots

**Status: code-only, private infrastructure proof of concept. Not yet safe for customer access.**
This replaces the idea of sharing the owner's single Railway `WonderSpace-IDE` service or
giving every customer its password. Do **not** attach the owner's Railway volume
or copy the owner's home directory into the base checkpoint: it can contain credentials.

## Why Railway Sandboxes

Railway now provides **native Sandboxes** (isolated Linux VMs), templates,
**checkpoints** (reusable disk snapshots), forks, idle timeouts and HTTPS domains.
This does not require running Docker-in-Docker, Kubernetes or Terraform inside Railway.
A normal Railway service could run the controller, but it must authenticate every
request and enforce compute budgets before creating a billable sandbox.

Plan the system in two complementary snapshot layers:

1. **One clean golden checkpoint** `wonderspace-clean-v1`. Created once from
   an isolated Railway sandbox that installs the same pinned code-server version
   as our operator IDE. No operator files, tokens, SSH keys or other credentials.
   Destroy the golden VM when its checkpoint is ready.
2. **One private, versioned gzip project snapshot per customer workspace** in
   the existing Supabase project's private object storage, keyed by the verified
   Supabase user UUID and independent workspace UUID. A new VM starts from the
   golden checkpoint and restores only that customer's project archive.
   The base checkpoint is not overwritten with one user's files.

When the customer clicks Open: authenticated site -> server-side cost/ownership
gate -> create a **new or reattached** sandbox from the golden checkpoint ->
restore own last verified gzip archive -> start code-server and an authenticated
proxy -> short-lived, single-use login ticket exchanged for an HttpOnly session
cookie -> customer browser connects over HTTPS/WebSockets.

Customers use their **existing DreamMakerHub login**, not the operator password.
The proxy must enforce ownership on HTTP **and WebSocket upgrades**, and bind
code-server to localhost with its own auth disabled only **behind** that
verified proxy. Never publish a sandbox containing an unauthenticated terminal.

## Save, stop and restart safely

- Save only `/home/coder/project` in a gzip tar archive. Do not archive
  `~/.ssh`, extension secrets, login sessions, provider keys, or operator data.
- A background worker uploads snapshots periodically while a workspace is
  active and again before an intentional stop. Store new immutable versions in
  Supabase Storage, checksum them and atomically mark a version restorable
  **before** destroying its sandbox. Never treat an attempted upload as a backup.
- Railway's own sandbox idle timeout can destroy a VM without calling the
  website's save route. An autosave worker with a shorter interval than the
  idle timeout is mandatory, and restoration must tolerate losing the last
  unsaved edits after a crash.
- A stopped workspace has **no running VM**. A new VM restores from its private
  gzip archive, or starts clean if there is no archive. A native per-workspace
  Railway checkpoint may later speed hot resumes, but the private gzip archive
  is the portable source of persistent customer data.
- Validate archive content and the owner/workspace path before extraction.
  Limit unpack size, file count and archive paths; extract as the unprivileged
  workspace user. Enforce isolation, rate limits and idempotent Start/Stop.
- Use the existing Supabase database for session metadata and cost accounting,
  not a second Postgres installation just for this controller.

## Hard spending and launch gates

The user's entire Railway bill must remain under **$10/month**. Sandboxes are
not free; their VM RAM/CPU/network usage draws from the same Railway usage
allowance as the website and the other services. On Hobby the sandbox creation
limit (50 per environment) is an availability cap, **not** a spending budget.
Until observed costs are verified, start with **one** concurrently running
customer test VM, a short (e.g. 10-minute) idle timeout, a separate hard session
runtime ceiling and a server-side reservation/usage ledger. Reject new starts
when the remaining allowance is insufficient. Independent cleanup must work
even if the website's normal scheduler or customer browser is offline.
Do not rely on the Railway account-wide compute hard stop alone: crossing
that limit can shut off the website and all other services as well.

Do not enable public customer access until:
- [ ] Supabase-authenticated provisioning API rejects another account's workspace.
- [ ] Random-per-sandbox, short-lived, single-use login works; the HTTPS proxy
      validates cookies and all WebSocket upgrades. No other customer's terminal,
      file preview or sandbox URL is accessible.
- [ ] The exact clean checkpoint and code-server installation boot in the
      configured Railway region. No old operator file, token or password is present.
- [ ] Versioned gzip snapshots are private, compressed, integrity-checked and
      restored to the correct owner's VM after a destroy/start cycle.
- [ ] Autosave and cost-stop workers survive interruptions and handle retries;
      direct Railway access cannot bypass the compute allowance.
- [ ] Two distinct non-admin users pass file, terminal, cross-access and budget
      expiry tests, and observed VM usage fits the approved monthly ceiling.

## Private smoke test already scaffolded here

`scripts/prepare-checkpoint.mjs` prepares a **new, clean sandbox**, installs
code-server, captures `wonderspace-clean-v1`, then destroys the source VM.
`scripts/checkpoint-gzip-roundtrip.mjs` creates two **sequential** private
VMs from that checkpoint. It writes a harmless test project in the first,
compresses the project to `.tar.gz`, destroys the first VM, restores the
archive into the second, verifies its contents and destroys the second.
Neither script creates a public domain or accesses customer/owner files.

Prerequisites: Node 22+, `npm install` in **this directory**, approved
Railway usage, a privately configured `RAILWAY_API_TOKEN` (workspace/account
token with access to this project) and `RAILWAY_ENVIRONMENT_ID` pointing to
the intended isolated **test** environment. Do not put tokens in GitHub.
The scripts refuse to run unless `CONFIRM_BILLABLE_SANDBOX_TEST=YES` is
explicitly set.

```sh
cd infra/wonderspace/railway-sandboxes
npm install
npm run check
# Only after explicit cost approval and setting credentials privately:
# CONFIRM_BILLABLE_SANDBOX_TEST=YES npm run prepare:checkpoint
# CONFIRM_BILLABLE_SANDBOX_TEST=YES npm run test:roundtrip
```

These scripts validate the **checkpoint + gzip** mechanism. They are not the
website's customer provisioner. The customer auth gateway, Supabase archival
worker, usage ledger, deployment and end-to-end tests still need implementation
and review before enabling customer sandbox creation.

Official references:
- https://docs.railway.com/sandboxes
- https://docs.railway.com/sandboxes/quickstart
- https://docs.railway.com/pricing/plans
- https://github.com/railwayapp/railway-ts-sdk
