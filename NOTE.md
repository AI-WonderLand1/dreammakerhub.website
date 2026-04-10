# Where We Are — April 2026

## Current Situation

We're deploying **DreamMakerHub** (formerly AI Wonderland) — a Coder-based cloud IDE platform on Oracle Cloud (OKE) with the domain `dreammakerhub.website`.

### What's Done
- All Kubernetes manifests are written and ready in `deploy/k8s/`
- Coder template (`kubernetes-devcontainer/main.tf`) uses pre-built IDE image (no envbuilder)
- Docker images defined: `Dockerfile.workspace` (IDE) and `Dockerfile.editor` (web app)
- Coder IDE settings page in the Next.js app
- All code fixes applied (authWorker, Dockerfile, etc.)
- Domain is registered at IONOS and pointed at Vercel for the web app

### What's Blocked
**Can't reach OKE cluster from local machine** — kubectl times out connecting to `163.192.214.49:6443`. All deployment must happen from **OCI Cloud Shell**.

### Next Steps (from OCI Cloud Shell)
1. Get kubeconfig: `oci ce cluster create-kubeconfig --cluster-id <OCID> --region us-chicago-1`
2. Install NGINX ingress
3. Get the LoadBalancer external IP
4. Add DNS records in IONOS: `ide` → LoadBalancer IP, `*.ide` → LoadBalancer IP (leave `@` and `www` alone — they point to Vercel)
5. Build & push IDE image to OCIR
6. `kubectl apply -f deploy/k8s/` everything
7. Login to Coder, push template, create workspace

### Architecture
```
dreammakerhub.website          → Vercel (Next.js web app)
ide.dreammakerhub.website      → OKE (Coder dashboard)
*.ide.dreammakerhub.website   → OKE (per-user IDE workspaces)
```

### Key Blocker
Need OCI Cloud Shell access to deploy. Local machine can't reach the OKE API server.

### Update - April 2026
Need to make image or use kurbunat.devcontainer