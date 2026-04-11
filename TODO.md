# DreamMakerHub - Active TODO

## Completed

### Critical Fixes
- [x] **`apps/web/lib/workspace/`** — Exports `provisionWorkspace`, `terminateWorkspace`, `getWorkspaceStatus`, `listUserWorkspaces`, `getWorkspaceUrls`, `WorkspaceType`. Dockerode-based with graceful fallback.
- [x] **Fix `Dockerfile.workspace` line 28** — Changed `ώξformulahendry.auto-rename-tag` → `formulahendry.auto-rename-tag`
- [x] **Fix `runners/authWorker.ts`** — Replaced `next-auth/jwt` (not installed) with Supabase auth. Created `lib/env.ts` and `lib/logger.ts`.
- [x] **Coder IDE settings page** — `dashboard/settings/coder/page.tsx` with workspace provisioning/listing/termination. Nav links added throughout.

### Deployment (dreammakerhub.website)
- [x] **Dockerfile.editor** — Rewrote for monorepo (pnpm, standalone output)
- [x] **Dockerfile.workspace** — IDE image with code-server, PlayCanvas, WebGL Studio
- [x] **`deploy/k8s/`** — Full Kubernetes manifests:
  - `namespace.yaml` — wonderland namespace
  - `configmap.yaml` — Updated for dreammakerhub.website
  - `secret.yaml` — App secrets + coder-db-url
  - `cert-manager.yaml` — Let's Encrypt cert-manager
  - `cluster-issuer.yaml` — Lets Encrypt issuer (aiwonderland111@gmail.com)
  - `coder-db.yaml` — PostgreSQL for Coder
  - `coder-deployment.yaml` — Coder server pod + PVC + service
  - `ide-deployment.yaml` — IDE workspace pod + PVC + service + LoadBalancer
  - `ingress.yaml` — dreammakerhub.website + TLS
  - `workspace-ingress.yaml` — *.ide.dreammakerhub.website wildcard + TLS
  - `web-deployment.yaml` — Next.js web app deployment
  - `web-service.yaml` — ClusterIP service for web app
- [x] **`kubernetes-devcontainer/main.tf`** — Updated Coder template:
  - Uses pre-built IDE image from OCIR (removed envbuilder)
  - VS Code Web module with extensions
  - PVC for persistent `/home/coder/project`
  - CPU/Memory/Storage parameters
  - Auto-clone git repo on workspace start
- [x] **deploy-ide.sh** — Full deploy script (build → push → apply)
- [x] **deploy.sh** — Full deploy script with cert-manager setup
- [x] **docker-compose.yml** — Local dev
- [x] **`.env.example`** — Updated with dreammakerhub.website domain
- [x] **`next.config.js`** — Added `output: 'standalone'` for Docker

### Architecture
```
dreammakerhub.website          → Vercel (Next.js web app)
ide.dreammakerhub.website      → OCI/OKE (Coder dashboard)
*.ide.dreammakerhub.website    → OCI/OKE (per-user IDE workspaces)
```

---

## TODO — Deployment Setup (run from OCI Cloud Shell)

- [ ] **Get OKE kubeconfig** from OCI Console → Kubernetes → Cluster → Access
- [ ] **Install NGINX ingress controller:**
  ```bash
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
  ```
- [ ] **Get LoadBalancer IP:**
  ```bash
  kubectl get svc -n ingress-nginx -w
  # Wait for EXTERNAL-IP
  ```
- [ ] **Add DNS records in IONOS** (do NOT modify existing @ or www records):
  - A record: `ide` → `[OKE LoadBalancer IP]`
  - A record: `*.ide` → `[OKE LoadBalancer IP]`
- [ ] **Build & push IDE image to OCIR:**
  ```bash
  docker build -t iad.ocir.io/$(oci ns get)/wonderspace/ide:latest -f Dockerfile.workspace .
  docker push iad.ocir.io/$(oci ns get)/wonderspace/ide:latest
  ```
- [ ] **Deploy everything:**
  ```bash
  kubectl apply -f deploy/k8s/namespace.yaml
  kubectl apply -f deploy/k8s/cert-manager.yaml
  kubectl apply -f deploy/k8s/cluster-issuer.yaml
  kubectl apply -f deploy/k8s/configmap.yaml
  kubectl apply -f deploy/k8s/secret.yaml
  kubectl apply -f deploy/k8s/coder-db.yaml
  kubectl apply -f deploy/k8s/coder-deployment.yaml
  kubectl apply -f deploy/k8s/ide-deployment.yaml
  kubectl apply -f deploy/k8s/ingress.yaml
  kubectl apply -f deploy/k8s/workspace-ingress.yaml
  ```
- [ ] **Get Coder admin token:**
  ```bash
  kubectl logs deployment/coder -n wonderland | grep token
  ```
- [ ] **Login to Coder & push template:**
  ```bash
  coder login https://dreammakerhub.website
  coder template push -d kubernetes-devcontainer wonderspace-ide
  ```
- [ ] **Create workspace:**
  ```bash
  coder create my-ide -t wonderspace-ide
  ```
- [ ] **Update `deploy/k8s/secret.yaml`** — Replace placeholder values with real Supabase/API keys
- [ ] **Update `coder-db-url` secret** — Replace `changeme` with a real PostgreSQL password

## TODO — Code Fixes Remaining

- [ ] **Real agent implementation** — Replace mock tools in `my-agent/agent.ts` with actual Supabase/Docker calls
- [ ] **Real runner implementation** — `runners/aiWorker.ts` is a stub returning hardcoded data
- [ ] **Coder IDE template configs** — Add `templates/ide/` with starter workspace configs

## TODO — Features (Implementation Plan)

- [ ] **Phase 1**: AI Builder → Puck (enhance AI chat to output Puck JSON)
- [ ] **Phase 3**: Coder settings connection flow (`lib/coder/connection.ts`)
- [ ] **Phase 4**: Git operations panel — commit/push/pull/sync API + UI
- [ ] **Phase 6**: Temp storage + 24hr warning modal
- [ ] **Phase 7**: BYOC integration (existing `lib/crypto/byoc.ts` + `StorageManager.ts`)
- [ ] **Phase 8**: Deploy & preview URLs

## Key Files Reference

| File | Purpose |
|------|---------|
| `kubernetes-devcontainer/main.tf` | Coder workspace template (pre-built image) |
| `Dockerfile.workspace` | IDE image (code-server + PlayCanvas + WebGL Studio) |
| `Dockerfile.editor` | Next.js web app image |
| `deploy/k8s/` | All Kubernetes manifests |
| `deploy-ide.sh` | Build + push + deploy script |
| `apps/web/app/(workspace)/dashboard/settings/coder/page.tsx` | Coder IDE settings UI |
| `apps/web/lib/workspace/provisioner.ts` | Docker workspace provisioning logic |
| `coder.env` | Coder server environment config |
| `.env.example` | All env vars (domain, Supabase, AI keys, OCI) |