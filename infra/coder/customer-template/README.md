# Customer IDE image runner (not live)

This is a **new, separate** Coder Kubernetes template, not a copy of the operator's `wonderingtribe/production` disk, credentials, or workspace. Import this directory as the NEW `dreammakerhub-customer-ide` template; never overwrite `wonderspace-ide`. The Coder provisioner is the runner: on workspace creation it asks Kubernetes to pull the selected approved image, creates a unique Deployment and persistent volume claim keyed by Coder workspace UUID, and proxies the owner-only `code-server` app. The user can reopen that same workspace later; do not create a new pod on every Open click. This PR does **not** install an autonomous AI agent or launch workspaces.

## Available profiles

- `linux`: Linux / VS Code (`codercom/enterprise-base:ubuntu`, the image used in the original template).
- `node`: Node.js / VS Code (`codercom/example-node:ubuntu`).

The server accepts only these profile IDs when they are offered by the published Coder template. Users cannot supply an arbitrary container image, registry URL, Kubernetes namespace, privileged mode, or Coder owner. Image tags in this candidate are **not digest-pinned**: before enabling customer pods, build/review images with code-server preinstalled, scan them and pin immutable sha256 digests. Replace the temporary startup download (`curl ... | sh`) with that reviewed image. Only a real Windows worker/node and a separate Windows-compatible Coder template can provide a Windows IDE; a Linux container image does not.

## Prerequisites before publishing

1. Create `coder-customers` namespace on the actual AWS Kubernetes cluster and attach a dedicated provisioner identity with narrowly scoped RBAC. Define namespace ResourceQuota, LimitRange, network isolation, registry rules and a network egress policy allowing only required services. The manifest is **not** included because cluster networking, service accounts and cost ceilings have not been verified. Do not grant access to the operator namespace, PVC, or pod. The template defaults to `coder-customers`; setting that variable does not create the namespace.
2. Verify dedicated **Coder** user identities linked server-side to verified Supabase Auth users via a tested OIDC authorization/consent flow. A Supabase UUID, shared `CODER_API_TOKEN`, or `CODER_WORKSPACE_OWNER=me` is not isolation. Restrict template publishing/editing to the operator. Test users A and B via direct Coder app URLs, API, port preview, SSH, terminal and storage.
3. Enforce a server-side running-compute-time ledger and reconcile/stop worker. Coder's `ttl_ms` and dashboard autostop alone are **not** a hard per-customer or monthly quota; direct Coder starts must be constrained too. Confirm stopped pods release compute while PVCs remain billable.
4. Install the new template with Coder CLI/dashboard, validate `terraform fmt` and `terraform validate` in an environment with the providers and Kubernetes credentials, publish and set `CODER_IDE_TEMPLATE_NAME=dreammakerhub-customer-ide` on the deployed website only after verifying it is accessible. Merely committing this file does not install it in Coder. Test the Node and Linux image pulls, agent readiness, browser IDE and workspace reopen.
5. Run CI plus a live two-user isolation and quota-expiry test. Keep `CODER_WORKSPACE_CREATION_ENABLED` and billing switches disabled for customers until these pass. Do not merge this draft solely to enable public provisioning.

## Source wiring in this change

`/api/user-workspace/options` returns the published template's approved `images` choices. The existing single-page WonderSpace form shows the selector and submits an `ideImage` profile ID. `/api/user-workspace/provision` validates it against the published and server-allowlisted choices **before reserving a slot**, then passes it as Coder parameter `ide_image`. Coder's Kubernetes provisioner resolves the profile to an admin-maintained registry image; both profiles use private port 13337 *inside their own pods*, with no per-user public AWS port or shared admin workspace. Existing owner-only provisioning guard remains in place. Reopen behavior is separately proposed in PR #536 and should be integrated/tested together before launch.

## Explicit limits

No customer pods, AWS resources, new Coder identities, hard quota, image digest pinning, or production deployment have been created by this source-only PR. The trial license expiration and provider costs require checking before any public launch.
