# WonderSpace: private Railway code-server pilot (NOT DEPLOYED)

**Scope:** one private, operator-only Linux/VS Code browser IDE. This is a
low-footprint replacement for manually editing code, **not** a replacement for
the AWS Kubernetes-based Coder control plane and **not** customer provisioning.
The existing site-side Supabase browser file manager remains independent.

No Railway services, volumes, variables, domains, subscriptions, or DNS records
are created by these files. Do **not** use this directory as the source for
the existing dreammakerhub.website Railway service.

## Why start here?

- AWS account was closed; the downloaded `coder-db-backup.sql` inspected on the
  authorized PC is empty (0 bytes), so restoring prior Coder workspace records
  has not been demonstrated.
- The old `coder` and `coder-customers` Kubernetes YAML exports are declarative
  configuration, not database contents or copies of persistent project files.
- Railway can run a persistent `code-server` service with a volume. A single
  password-protected Linux IDE **must not** be shared among customers. No
  customer account isolation or hard compute cap is implemented here.

## Before any billable deployment: owner approval required

1. Review this source as a draft PR. Confirm actual Railway incremental costs
   for one running service and one persistent volume, and configure billing
   alerts/usage limits; paid Railway access is **not** unlimited free CPU.
2. When the owner explicitly authorizes spending, create a **separate service**
   in the existing Railway project from this GitHub repo, branch containing
   this directory, with **root directory**
   `/infra/wonderspace/railway-operator-pilot`. Set its Dockerfile to
   `Dockerfile`. Never change the main website's root directory.
3. Before publishing a Railway domain, set a freshly generated, private
   `PASSWORD` (or `HASHED_PASSWORD`) in *that service's* Railway Variables.
   Do not reuse old Kubernetes secrets, GitHub Actions secrets or downloaded
   secret YAML. `PORT=8080` is the expected default.
4. Add a **new** Railway persistent volume mounted at `/home/coder`. Without
   the volume, project files and editor configuration can disappear on deploy.
   Use one replica (Railway volumes cannot be a shared multi-writer filesystem).
   Begin with an operator-agreed CPU/RAM/volume allowance. Set a budget alert.
5. Initially use a separate Railway-generated HTTPS test domain. Protect it
   with the unique operator password; consider Cloudflare Access as an
   additional perimeter before allowing a publicly discoverable hostname.
   This server exposes a terminal and must remain owner-only.
6. Verify the login rejects unauthenticated access, editor and terminal work,
   Git works with the owner's own authentication, and files in
   `/home/coder/project` survive a **redeploy** and a service restart. Confirm
   `/healthz`, TLS, WebSockets, volume persistence and resource usage.
7. Only after that verified pilot, decide on a **separate customer** architecture
   with isolated identities, independent filesystem and runtime per customer,
   reliable hard time/compute caps, suspend/resume, and budget enforcement.
   Do not connect this code-server URL to the website's `CODER_API_URL`:
   code-server is not the Coder v2 API.

## Constraints and rollback

- AWS Kubernetes Terraform templates in `infra/coder/customer-template` are
  **not** compatible with this single Railway container. Do not publish those
  templates or turn on `CODER_CUSTOMER_PROVISIONING_ENABLED` or
  `CODER_WORKSPACE_CREATION_ENABLED` on account of this pilot.
- `codercom/code-server:4.130.0` is **version-tag pinned**, not digest-pinned.
  Scan and digest-pin the verified image before expanding exposure.
- The startup script runs briefly as root to prepare the Railway volume, then
  starts the IDE as the unprivileged `coder` account. This is not a
  hardened, multi-tenant sandbox; shell access is inherently privileged
  within the customer's own IDE workload.
- Installing OS packages interactively outside the mounted home directory
  does not survive rebuilding the image.
- Rollback the pilot by disabling/removing **only this new Railway service**;
  leave existing website, playground, WonderPlay, and all current databases
  untouched. Back up its volume to external storage before deleting it.
- Do not claim that AWS Coder project files are restored until an independently
  verified backup is located and restoration is tested.

References:
- https://railway.com/deploy/code-server-2
- https://docs.railway.com/volumes
- https://docs.railway.com/deployments/monorepo
