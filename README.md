# Ai-Wonderland

AI-powered creative platform for building web experiences, 3D worlds, and interactive apps.

## Quick Start

```bash
npm install
npm run dev
```

my website to see it is www.dreammakerhub.website.

## Tech Stack

- **Framework:** Next.js (TypeScript)
- **Auth:** Supabase Auth
- **3D Engines:** PlayCanvas, WebGL Studio
- **Visual Editor:** Puck (drag-and-drop page builder)
- **AI:** OpenRouter, Groq, GitHub Models
- **Infrastructure:** OCI Kubernetes (OKE), Coder (cloud IDE)
- **Deployment:** Self-hosted (Oracle Cloud VM / OKE)

## Project Structure

```
apps/web/          → Next.js app (pages, API routes, components)
engine/core/      → AI orchestration, IDE runtime, PlayCanvas bridge
packages/         → Shared packages (ide-engine, playcanvas-ext, puck-editor, etc.)
ui/components/    → Reusable UI components (ChatBox, SpiritGuide, etc.)
lib/              → Shared utilities (env, logger, auth, crypto)
runners/          → Background workers (aiWorker, authWorker, registry)
scripts/          → Shell scripts (build, smoke test, deploy)
infra/coder/      → Coder workspace template + Helm values
config/           → AI system prompts, constitution
```

## Environment Variables

See `.env.example` for all configuration including:
- Supabase URL and keys
- OpenRouter / Groq / GitHub API keys
- `CODER_ACCESS_URL` — Coder instance URL
- `CODER_WILDCARD_ACCESS_URL` — Workspace app URLs

## Infrastructure

| Resource | Details |
|----------|---------|
| OKE Cluster | `cluster1` in us-chicago-1 |
| Node Pool | E5.Flex, 1 node at 10.0.10.213 |
| Coder | v2.32.0, template at `infra/coder/template/main.tf` |

## Full Documentation

See [DOCS.md](./DOCS.md) for architecture, integration guides, deployment, security, and troubleshooting.
## Deployment (No Vercel)

If you are hosting on Oracle and using Supabase, use:
- [docs/guides/oracle-no-vercel-deployment.md](./docs/guides/oracle-no-vercel-deployment.md)


## Contributing

See [DOCS.md → Contributing](./DOCS.md#contributing) for setup and code style rules.

# Custom PlayCanvas/WebGL Workspace Image (Per-User Isolation)

This guide is for creating a **dedicated runtime image** for user-isolated PlayCanvas + WebGL Studio workspaces.

## What exists in this repo today (verified)

- The tenant IDE proxy already expects per-workspace runtime routing and supports either:
  - subdomain mode via `WORKSPACE_DOMAIN`, or
  - local runtime mode via `DOCKER_HOST`/`DOCKER_SOCKET` + deterministic ports from `workspaceId`.
- Workspace URLs are already derived as:
  - `https://{workspaceId}.{domain}` (IDE)
  - `https://pc-{workspaceId}.{domain}` (PlayCanvas)
  - `https://ws-{workspaceId}.{domain}` (WebGL Studio).
- Current `provisionWorkspace()` is a mock and does not yet create real containers/pods.
- A dedicated PlayCanvas runtime Dockerfile is not present (only `packages/optimizer/Dockerfile` exists today).

## Target runtime contract

For each user workspace, run one pod/container exposing three internal ports:

- `3000` → IDE (main shell)
- `3001` → PlayCanvas service
- `3002` → WebGL Studio service

That matches the current proxy assumption of base port + offsets (`+0`, `+1`, `+2`).

## 1) Create a dedicated image

Add a new Dockerfile at repository root (example name: `workspace-runtime.Dockerfile`):

# dockerfile

# FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    git openssh-client ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Install repo deps once (workspace-aware)
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ ./packages/
RUN npm ci 

# Copy source
COPY

# Non-root runtime
RUN useradd -m -u 10001 wonder && chown -R wonder:wonder /workspace
USER wonder

# build tag
docker build -f workspace-runtime.Dockerfile -t ghcr.io/<org>/wonderspace-runtime:<tag> .

# Expected ports for IDE + PlayCanvas + WebGL Studio
EXPOSE 3000 3001 3002

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bash", "-lc", "./scripts/workspace-runtime/start-all.sh"]

Use immutable tags (git-sha), not only latest.

# 3) Wire runtime creation (replace mock provisioning)
Replace mockWorkspace() behavior in provisionWorkspace() with a real provisioner adapter that:

Receives workspaceId, userId, resource profile.

Creates one container/pod named from workspaceId.

Attaches per-workspace persistent volume.

Returns URLs already expected by getWorkspaceUrls() contract.

# 4) Enforce user isolation boundaries
Minimum controls for user A vs user B:

Never accept browser-provided ownership as truth; validate server-side identity for every workspace action.

Volume per workspace (pvc-{workspaceId} or equivalent).

Network isolation policy per namespace/workspace label.

No shared SSH authorized_keys files between workspaces.

Idle timeout cleanup and explicit revocation path.

# 5) Route traffic
Prefer WORKSPACE_DOMAIN mode in production so the existing proxy redirects by subdomain (pc-, ws-, etc.).

# Set:

WORKSPACE_DOMAIN=ide.yourdomain.com

wildcard DNS + wildcard TLS cert

# 6) Operational checklist
Health endpoints for all 3 services (/healthz).

Resource requests/limits per plan tier.

Container/pod TTL after inactivity.

Audit logs for: userId, workspaceId, image tag, SSH fingerprint.

Notes on uncertainty
This guide intentionally aligns to the runtime assumptions in current app code. It does not assume your final orchestrator (Docker API vs Kubernetes controller); either can work if it honors the URL/port contract above
