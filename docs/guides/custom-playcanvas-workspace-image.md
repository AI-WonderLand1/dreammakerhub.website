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

```dockerfile
FROM node:20-bookworm-slim

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
COPY . .

# Non-root runtime
RUN useradd -m -u 10001 wonder && chown -R wonder:wonder /workspace
USER wonder

# Expected ports for IDE + PlayCanvas + WebGL Studio
EXPOSE 3000 3001 3002

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bash", "-lc", "./scripts/workspace-runtime/start-all.sh"]
