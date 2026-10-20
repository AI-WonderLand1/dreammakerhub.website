# Customer Coder IDE runtime profiles — staged rollout

Status: **code only, not deployed**. This work does not enable customer workspace creation and does not run on the production Docker host automatically.

## User flow
DreamMakerHub project → IDE → choose Docker development environment and bounded machine profile → provision → open authenticated code-server.

The customer-facing runtime IDs are **linux**, **web**, **python**, **webgl**. They map to **operator-controlled images** inside the Coder template. The website never accepts image names, Docker sockets or arbitrary registries. All four are **Linux containers**; they are *not* Windows/macOS VMs. Windows-native Unreal/Visual Studio/Xbox workloads require a separately secured Windows worker or build service. PlayCanvas/WebGL editing can run with Node and browser rendering, with no GPU passed to customer containers.

### Docker images
- `linux`: base workspace image, Node 22, Python 3, git, code-server via Coder.
- `web`: extends Linux with Vite, TSX and ESLint tooling.
- `python`: extends Linux with a Python virtual environment and FastAPI/Uvicorn/HTTPX/Pydantic.
- `webgl`: extends Linux with Vite, ffmpeg and OpenGL userspace libraries; **not** an Unreal engine or GPU inference runtime.

Images are built by `.github/workflows/coder-workspace-image.yml` when `Master` changes or when manually dispatched. The base build must succeed before the three derived images are built. The images are published to GHCR with revision tags. **Pin exact audited image digests using Coder Terraform variables before customer rollout**; `:latest` defaults are for staging convenience, not a production supply-chain guarantee.

## Deployment prerequisites (in order)
1. Confirm the real Coder control plane / provisioner and Docker host. Older docs reference Google and AWS; do not assume the active HostBrr host is connected to the Coder provisioner. Verify Coder URL, wildcard app hostname TLS, OIDC and per-customer identity without exposing tokens.
2. Inspect RAM/disk/CPU budgets and storage backup plan. Do **not** run unlimited customer workspaces on the small web host. Set host/provider budgets and concurrency controls; the existing template bounds each workspace to Micro (1 CPU, 2 GiB) or Standard (2 CPU, 4 GiB). Persistent Docker volumes survive stops, not necessarily host loss.
3. Build all four images in GitHub Actions, review logs and confirm pull permissions from the actual Coder Docker provisioner. Pin digests and push the updated `infra/coder/google-docker-template` to staging using the proper provisioner tag (do not reuse the legacy Railway or Kubernetes templates).
4. Test Linux and each variant in staging: login, customer OIDC, create, code-server terminal, `node --version`, `python --version`, `git --version`, sample build, stop/start persistence, and template-version preservation. Also test non-admin isolation: customers cannot read another user's workspace or Docker socket.
5. Apply `supabase/migrations/202610201500_coder_customer_runtime_profile.sql` **after backup and staging test**. Existing jobs default to `linux`. App deployment must not send an `ide_image` field until the DB column exists.
6. Deploy the website to staging. Verify `GET /api/user-workspace/options` returns only profiles actually published by Coder, never a fabricated ready state. The legacy published template (without `ide_image`) exposes Linux only. Unsupported/forged values fail before DB reservation.
7. Test authorization, billing limits, concurrent reservations, ownership, monitoring and auto-stop. Only then deliberately enable `CODER_CUSTOMER_PROVISIONING_ENABLED=true` and `CODER_WORKSPACE_CREATION_ENABLED=true` in the authenticated server runtime. **Never** place these values or Coder credentials in `NEXT_PUBLIC_*`.

## Explicit limitations
- This PR does **not** start or verify a live IDE and does not repair DNS or Coder OIDC.
- It does **not** provide Windows containers, GPU compute, nested Docker, full PlayCanvas hosting, or a guaranteed budget ceiling.
- Existing customer workspace jobs must be reconciled before rollout. Updating an existing job's image is intentionally unsupported: choose a new workspace to change environment; back up/move project files explicitly.
- The visual builder is a separate code path. Its save, AI, drag-and-drop and publish pipeline require their own browser/production smoke tests; a running IDE is not proof that the builder works.
