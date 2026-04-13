# DreamMakerHub - Active TODO

## Completed

### Critical Fixes
- [x] **`apps/web/lib/workspace/`** — Exports `provisionWorkspace`, `terminateWorkspace`, `getWorkspaceStatus`, `listUserWorkspaces`, `getWorkspaceUrls`, `WorkspaceType`. Dockerode-based with graceful fallback.
- [x] **Fix `runners/authWorker.ts`** — Replaced `next-auth/jwt` (not installed) with Supabase auth. Created `lib/env.ts` and `lib/logger.ts`.

### Deployment (dreammakerhub.website)
- [x] **Dockerfile.editor** — Rewrote for monorepo (pnpm, standalone output)
- [x] **`deploy/k8s/`** — Kubernetes manifests:
  - `namespace.yaml` — wonderland namespace
  - `configmap.yaml` — Updated for dreammakerhub.website
  - `secret.yaml` — App secrets
  - `cert-manager.yaml` — Let's Encrypt cert-manager
  - `cluster-issuer.yaml` — Let's Encrypt issuer (aiwonderland111@gmail.com)
  - `ingress.yaml` — dreammakerhub.website + TLS
  - `web-deployment.yaml` — Next.js web app deployment
  - `web-service.yaml` — ClusterIP service for web app
- [x] **deploy.sh** — Full deploy script with cert-manager setup
- [x] **docker-compose.yml** — Local dev
- [x] **`.env.example`** — Updated with dreammakerhub.website domain
- [x] **`next.config.js`** — Added `output: 'standalone'` for Docker

### Architecture
```
dreammakerhub.website          → Vercel (Next.js web app)
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
- [ ] **Deploy web app:**
  ```bash
  kubectl apply -f deploy/k8s/namespace.yaml
  kubectl apply -f deploy/k8s/cert-manager.yaml
  kubectl apply -f deploy/k8s/cluster-issuer.yaml
  kubectl apply -f deploy/k8s/configmap.yaml
  kubectl apply -f deploy/k8s/secret.yaml
  kubectl apply -f deploy/k8s/web-deployment.yaml
  kubectl apply -f deploy/k8s/web-service.yaml
  kubectl apply -f deploy/k8s/ingress.yaml
  ```
- [ ] **Update `deploy/k8s/secret.yaml`** — Replace placeholder values with real Supabase/API keys

## TODO — Code Fixes Remaining

- [ ] **Real agent implementation** — Replace mock tools in `my-agent/agent.ts` with actual Supabase calls
- [ ] **Real runner implementation** — `runners/aiWorker.ts` is a stub returning hardcoded data

## TODO — Features (Implementation Plan)

- [ ] **Phase 1**: AI Builder → Puck (enhance AI chat to output Puck JSON)
- [ ] **Phase 4**: Git operations panel — commit/push/pull/sync API + UI
- [ ] **Phase 6**: Temp storage + 24hr warning modal
- [ ] **Phase 7**: BYOC integration (existing `lib/crypto/byoc.ts` + `StorageManager.ts`)
- [ ] **Phase 8**: Deploy & preview URLs

## Key Files Reference

| File | Purpose |
|------|---------|
| `Dockerfile.editor` | Next.js web app image |
| `deploy/k8s/` | Kubernetes manifests |
| `deploy.sh` | Deploy script |
| `apps/web/lib/workspace/provisioner.ts` | Docker workspace provisioning logic |
| `.env.example` | All env vars (domain, Supabase, AI keys, OCI) |