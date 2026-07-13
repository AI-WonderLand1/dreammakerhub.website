# Deployment topology — single source of truth

DreamMakerHub is split across three platforms. Each subdomain has exactly one
origin. Cloudflare (orange-cloud proxy) sits in front of all of them.

| Domain / subdomain                         | Origin                    | Served by                                  |
| ------------------------------------------ | ------------------------- | ------------------------------------------ |
| `dreammakerhub.website`, `www`             | **AWS EC2**               | Next.js via `pm2` behind `nginx` (this repo) |
| `ai.dreammakerhub.website`                 | **AWS EC2**               | `AI-PLAYGROUND` repo                        |
| `ide.dreammakerhub.website`                | **Civo Kubernetes**       | Coder IDE (`deploy/k8s/`)                   |
| `*.coder.dreammakerhub.website`            | **Civo Kubernetes**       | Coder workspaces (`deploy/k8s/workspace-ingress.yaml`) |
| `play.`, `wonderplay.`, `playcanvas.`      | **LightningAI**           | 3D engine (WebGLStudio / PlayCanvas)       |

The main site's nginx also reverse-proxies the `/webglstudio/` and `/playcanvas/`
paths on the apex domain to LightningAI via `LIGHTNING_3D_URL` (see `deploy.sh`).

## 1. Main website — AWS EC2

Canonical script: **`deploy/deploy.sh`** (run ON the EC2 instance).
Reference nginx config: **`deploy/nginx-dreammakerhub.conf`**.

```bash
# on the EC2 box
LIGHTNING_3D_URL=https://<your-lightning-ingress> \
ENABLE_TLS=true \
EMAIL=aiwonderland111@gmail.com \
./deploy/deploy.sh
```

Requirements:
- `apps/web/.env.production` must exist ON the server with real values
  (it is **git-ignored** — never commit it). Template: `.env.example`.
- Cloudflare `A` record for `dreammakerhub.website` + `www` -> EC2 public IP.
- Security group / `ufw` must allow inbound `80` + `443` (see `deploy/fix-access.sh`).

Helper: `deploy/fix-access.sh` diagnoses reachability and opens firewall ports
(useful for debugging Cloudflare `521` errors, which mean the origin is unreachable).

## 2. IDE — Civo Kubernetes

Manifests in **`deploy/k8s/`**:
- `ide-deployment.yaml` — Coder IDE deployment, service, PVC, namespace, secret.
- `ingress.yaml` — routes **only** `ide.dreammakerhub.website` (TLS via cert-manager).
- `workspace-ingress.yaml` — wildcard `*.coder.dreammakerhub.website`.
- `cert-manager.yaml`, `cluster-issuer.yaml` — TLS (Let's Encrypt).
- `coder-db.yaml`, `coder-deployment.yaml`, `configmap.yaml` — Coder control plane.

```bash
kubectl apply -f deploy/k8s/
# set the Coder session token (do NOT commit it):
kubectl create secret generic coder-env -n coder \
  --from-literal=CODER_SESSION_TOKEN=<token> --dry-run=client -o yaml | kubectl apply -f -
```

Cloudflare `A`/`CNAME` records for `ide.` and `*.coder.` -> Civo LoadBalancer IP.

## 3. 3D engine — LightningAI

Hosted on LightningAI. Point the `play.` / `wonderplay.` / `playcanvas.` DNS
records at the LightningAI ingress, and set `LIGHTNING_3D_URL` when running
`deploy.sh` so the apex domain can proxy `/webglstudio/` and `/playcanvas/`.

## Legacy / not the source of truth

These exist in the repo but are **not** the canonical deploy path for the website.
Keep only if actively used; otherwise remove to avoid confusion:

- `railway.json`, `ecosystem.config.cjs` — Railway/PaaS attempts (stale paths).
- `.replit` — Replit dev environment only.
- Oracle OCI image registries (`iad.ocir.io`, `ord.ocir.io`) — image hosting.
- `deploy/setup-website.sh` — superseded by `deploy/deploy.sh`.

## Secrets

Never commit secrets. All of the following are git-ignored:
`.env`, `.env.*` (except `.env.example`), `apps/web/.env.production`, `*.pem`,
`*.key`, `new-aws-key*`, `agent/data/*.db`. Provide real values via server env,
Kubernetes secrets, or your platform's secret manager.
