# Cloud IDE Platform - Implementation Plan

> **Last Updated:** 2026-04-09  
> **Target:** MVP in 2-4 weeks  
> **Status:** Planning

---

## Executive Summary

Build a GitHub Codespaces-like cloud IDE platform where users:
- Get their own isolated IDE workspace
- Can name their workspace
- Choose IDE type per project
- Access from browser (no installation)
- Deploy to cloud

---

## Your Current Stack (What's Working)

| Component | Status |
|-----------|--------|
| Docker provisioning (Dockerode) | Working |
| K8s manifests for OCI OKE | Complete |
| Terraform for Coder | Working |
| code-server (VS Code in browser) | Working |
| Multi-engine shell (IDE + PlayCanvas + WebGL + Puck) | Working |
| Workspace CRUD API | Working |
| Database schema (Supabase) | Working |

---

## Critical Gaps to Address

1. **No per-user workspace isolation** - Only single shared workspace
2. **No compute tier/region selection** - Hardcoded resources
3. **No workspace start/stop lifecycle** - Only create/destroy
4. **No rate limiting** - Workspace creation not protected
5. **No network policies** - No pod isolation
6. **No `.devcontainer/`** - No standard build system

---

## Implementation Plan

### Phase 1: Control Plane (Week 1)

#### 1.1 Database Schema Enhancement
Create `supabase/migrations/003_enhance_workspaces.sql`:
- Add `name`, `region`, `compute_tier`, `status` columns
- Create `regions` table for multi-region
- Create `workspace_templates` table
- Create `audit_logs` table

#### 1.2 API Endpoints
| Endpoint | Description |
|----------|-------------|
| `POST /api/workspaces` | Create with name, region, template, tier |
| `GET /api/workspaces` | List user's workspaces |
| `GET /api/workspaces/[id]` | Get workspace details |
| `PATCH /api/workspaces/[id]` | Update (name, tier) |
| `DELETE /api/workspaces/[id]` | Delete workspace |
| `POST /api/workspaces/[id]/start` | Start stopped workspace |
| `POST /api/workspaces/[id]/stop` | Stop running workspace |
| `GET /api/regions` | List available regions |
| `GET /api/templates` | List IDE templates |

#### 1.3 Rate Limiting
- Workspace create: 5/minute per user
- Workspace delete: 10/minute per user
- General API: 100/minute

#### 1.4 Audit Logging
Log all workspace operations with user, action, resource, IP, timestamp

---

### Phase 2: Build System (Week 1-2)

#### 2.1 Create `.devcontainer/`
- `devcontainer.json` - VS Code settings & extensions
- `Dockerfile` - Build with code-server + Node + tools
- `post-create.sh` - Initial workspace setup
- `post-start.sh` - Startup script with health check

#### 2.2 GitHub Actions Prebuilds
Create `.github/workflows/prebuild.yml`:
- Build image on push to main
- Cache layers aggressively
- Push to ghcr.io registry
- Update template in Supabase

#### 2.3 Template Variants
| Template | Use Case |
|----------|----------|
| vscode-browser | General web dev |
| nodejs | Node/TypeScript |
| python | ML, data science |
| go | Go development |
| rust | Rust development |

---

### Phase 3: Runtime Isolation (Week 2)

#### 3.1 Docker Swarm Setup
- Create overlay network for isolation
- Deploy per-user workspace containers
- Health checks on all containers
- Resource limits per tier

#### 3.2 Compute Tiers
| Tier | CPU | Memory | Storage |
|------|-----|--------|---------|
| small | 1 | 2 GB | 10 GB |
| medium | 2 | 4 GB | 20 GB |
| large | 4 | 8 GB | 50 GB |
| gpu | 4 | 16 GB | 100 GB |

#### 3.3 Idle Timeout
- Check heartbeat every 5 minutes
- Auto-stop after 30 minutes idle

---

### Phase 4: IDE Connectivity (Week 2)

#### 4.1 VS Code Browser
- Health endpoint at `/healthz`
- WebSocket support enabled
- CORS headers for proxy

#### 4.2 VS Code Desktop SSH
- Add user's public key to workspace
- Provide SSH connection string

#### 4.3 Git Integration
- Set git config from user profile
- Short-lived OAuth tokens for GitHub

---

### Phase 5: Security Model (Week 2-3)

#### 5.1 Network Isolation
- Overlay network per workspace
- No inter-workspace communication
- NetworkPolicy resources

#### 5.2 Short-Lived Credentials
- 1-hour token expiration
- Encrypted storage
- Auto-revocation

#### 5.3 Secrets Management
- Kubernetes Secrets
- AES-256-GCM encryption for user secrets

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/003_enhance_workspaces.sql` | Schema |
| `apps/web/lib/rate-limit.ts` | Rate limiting |
| `apps/web/lib/audit.ts` | Audit logging |
| `apps/web/lib/idle-detector.ts` | Idle detection |
| `apps/web/lib/credentials.ts` | Short-lived tokens |
| `apps/web/app/api/workspaces/route.ts` | CRUD API |
| `apps/web/app/api/workspaces/[id]/start/route.ts` | Start |
| `apps/web/app/api/workspaces/[id]/stop/route.ts` | Stop |
| `.devcontainer/devcontainer.json` | Dev env config |
| `.devcontainer/Dockerfile` | Container build |
| `.devcontainer/post-create.sh` | Setup script |
| `.devcontainer/post-start.sh` | Startup script |
| `.github/workflows/prebuild.yml` | CI/CD |
| `docker/docker-compose.swarm.yml` | Swarm config |
| `docker/init-swarm.sh` | Swarm init |
| `deploy/k8s/network-policy.yaml` | K8s isolation |

---

## Quick Start Commands

```bash
# Initialize Docker Swarm
./docker/init-swarm.sh

# Build workspace image
docker build -f .devcontainer/Dockerfile -t workspace:test .

# Deploy to Swarm
docker stack deploy -c docker/docker-compose.swarm.yml wonderspace

# Check health
curl http://localhost:8080/healthz
```

---

## Future Enhancements

1. JetBrains Gateway support
2. Prebuilt workspaces (repo cloned)
3. Real-time collaboration
4. Workspace snapshots/backup
5. Custom user templates
6. GPU workspaces (CUDA/ROCm)
7. Multi-region deployment
8. Per-second billing
9. SSO/SAML enterprise auth

