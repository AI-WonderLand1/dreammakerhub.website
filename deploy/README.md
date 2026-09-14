# Deployment topology — single source of truth

DreamMakerHub is split across three platforms. Each subdomain has exactly one
origin. Cloudflare (orange-cloud proxy) sits in front of all of them.

## Provider-Based Deployment Map

| Component Type        | Provider        | Domain / subdomain                         | Deploy Script/Manifests                     |
| --------------------- | --------------- | ------------------------------------------ | ------------------------------------------- |
| **IDEs**              | **Civo**        | `ide.dreammakerhub.website`                | `deploy/civo/`                              |
| **IDEs (Coder)**      | **Civo**        | `*.coder.dreammakerhub.website`            | `deploy/civo/`                              |
| **Main Website**      | **AWS**         | `dreammakerhub.website`, `www`             | `deploy/aws/`                               |
| **AI Playground**     | **AWS**         | `ai.dreammakerhub.website`                 | `deploy/aws/`                               |
| **Other Services**    | **AWS**         | Various                                    | `deploy/aws/`                               |

## Detailed Provider Breakdown

### 1. Civo — IDEs

All development environments and IDE services deploy to Civo Kubernetes:

- **Coder Control Plane** — Manages workspace lifecycle
- **Node IDE** — JavaScript/TypeScript development environment
- **Python IDE** — Python development environment
- **Coder Workspaces** — Individual user workspace instances

DNS records (`ide.`, `*.coder.`) point to Civo LoadBalancer IP.

### 3. AWS — Everything Else

All non-3D, non-IDE services deploy to AWS EC2:

- **Main Website** — Next.js frontend & API (`apps/web`)
- **AI Playground** — AI-powered development tools (`AI-PLAYGROUND` repo)
- **Optimizer** — Resource optimization service
- **Supporting Services** — Auth workers, data processing, etc.

DNS records (`dreammakerhub.website`, `www`, `ai.`) point to EC2 public IP.

## Quick Reference — Deploy Commands

```bash
# Deploy IDEs to Civo
./deploy/civo/deploy.sh apply

# Deploy main website to AWS (run on EC2)
ENABLE_TLS=true \
EMAIL=aiwonderland111@gmail.com \
./deploy/aws/deploy.sh
```

## Detailed Provider Instructions

### 1. Civo — IDEs

See `deploy/civo/README.md` for full details.

```bash
# Deploy all IDEs to Civo
./deploy/civo/deploy.sh apply

# Check status
./deploy/civo/deploy.sh status
```

DNS records to configure:
- `ide.dreammakerhub.website` -> Civo LoadBalancer IP
- `*.coder.dreammakerhub.website` -> Civo LoadBalancer IP

### 2. AWS — Main Website & Services

See `deploy/aws/README.md` for full details.

```bash
# On EC2 instance
ENABLE_TLS=true \
EMAIL=aiwonderland111@gmail.com \
./deploy/aws/deploy.sh
```

DNS records to configure:
- `dreammakerhub.website` -> EC2 public IP
- `www.dreammakerhub.website` -> EC2 public IP
- `ai.dreammakerhub.website` -> EC2 public IP

## Legacy / not the source of truth

These exist in the repo but are **not** the canonical deploy path for the website.
Keep only if actively used; otherwise remove to avoid confusion:

- `railway.json`, `ecosystem.config.cjs` — Railway/PaaS attempts (stale paths).
- `.replit` — Replit dev environment only.
- Oracle OCI image registries (`iad.ocir.io`, `ord.ocir.io`) — image hosting.
- `deploy/setup-website.sh` — superseded by `deploy/deploy.sh`.

## Secrets

Never commit secrets. `.env`, `.env.*` (except `.env.example`),
`apps/web/.env.production`, `*.pem`, `*.key`, `new-aws-key*`, and
`agent/data/*.db` are git-ignored.

For the production DreamMakerHub web application, **GitHub Actions secrets and
variables are the source of truth**. `.github/workflows/deploy-upcloud.yml`
serializes the approved runtime values without printing them, copies them to the
server over SSH, removes stale project-local Infisical configuration, replaces
GitHub-managed application keys in the production `.env`, and recreates the web
container. Do not hand-maintain production application secrets in Infisical or
in the server `.env`.
