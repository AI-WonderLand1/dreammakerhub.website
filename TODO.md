# DreamMakerHub - Active TODO

## Completed

### Infrastructure (OCI)
- [x] **OCI Kubernetes (OKE)** — Cluster `cluster1` in US-Chicago-1 region
- [x] **Node Pool** — E5.Flex instance running at 10.0.10.213
- [x] **Kubeconfig** — Configured at `~/.kube/config`, public endpoint 64.181.195.19:6443
- [x] **Coder installed** — v2.32.0 running as systemd service

### Coder Setup
- [x] **Coder namespace** — `kubectl create namespace coder`
- [x] **Coder workspace template** — `infra/coder/template/main.tf`
- [x] **Coder systemd service** — `/etc/systemd/system/coder.service`
- [x] **Kubeconfig for Coder** — `/home/coder/.kube/config`
- [x] **Coder template working** — Users can create workspaces

### DNS
- [x] **coder.dreammakerhub.website** — Points to OCI Load Balancer (direct, no Cloudflare tunnel)

### OCI Resource IDs
- Cluster: `ocid1.cluster.oc1.us-chicago-1.aaaaaaaakb4d4grfqla4lfxurzcp5y6j62lqpbtemxrtqfckpcmraeladnoa`
- Node Pool: `ocid1.nodepool.oc1.us-chicago-1.aaaaaaaaxjiyz4tf7qtafvwjiykjss5j25c2eppvlfqny3q52n537ptwnjbq`
- Bastion: `ocid1.bastion.oc1.us-chicago-1.amaaaaaadziiscia3wl7qacwnvgikdc7gzb5pn37ruskngzk3qw2ken7hlca`
- Compartment: `ocid1.tenancy.oc1..aaaaaaaa24524q6ybwpvtywhpatteelgsxcbv36zkp6uovifyg4ofeysfsgq`

---

## In Progress

### Coder Integration
- [ ] **Add "Create Private IDE" link to site** — Button/page linking to coder.dreammakerhub.website
- [ ] **Private projects per user** — Ensure workspaces are isolated per-user
- [ ] **Custom workspace template** — Template with private storage/Docker/extensions

---

## TODO — Features

- [ ] **Phase 1**: AI Builder → Puck (enhance AI chat to output Puck JSON)
- [ ] **Phase 4**: Git operations panel — commit/push/pull/sync API + UI
- [ ] **Phase 6**: Temp storage + 24hr warning modal
- [ ] **Phase 7**: BYOC integration (existing `lib/crypto/byoc.ts` + `StorageManager.ts`)
- [ ] **Phase 8**: Deploy & preview URLs

---

## TODO — AI & Persona (from Simple-Rick-Ai-1)

- [ ] **Persona System** — Add Rick Sanchez persona with AI Constitution rules
  - [ ] Create `packages/engine-core/src/personas.ts` with persona prompts
  - [ ] Add constitutional rules (no secrets, transparency requirements)
  - [ ] Integrate into AI chat pipeline

- [ ] **Confessions System** — Track AI uncertainty, corrections, limitations
  - [ ] Import `confessions.ts` and `types.ts` from Simple-Rick-Ai-1
  - [ ] Create types: `ConfessionType`, `ImpactLevel`, `ConstitutionalRules`
  - [ ] Build factories: `createUncertaintyConfession`, `createCorrectionConfession`, etc.
  - [ ] Wire into AI pipeline to log confessions per request

- [ ] **AI Provider Integration** — Gemini + neutrality monitoring
  - [ ] Import `geminiService.ts` wrapper
  - [ ] Add neutrality monitor (pre-check prompts for bias)
  - [ ] Support multiple providers (GitHub, OpenRouter, Groq)

## Key Files Reference

| File | Purpose |
|------|---------|
| `infra/coder/template/main.tf` | Coder workspace template (Kubernetes) |
| `/etc/systemd/system/coder.service` | Coder systemd service config |
| `~/.kube/config` | Kubernetes config for OKE cluster |
| `apps/web/lib/workspace/provisioner.ts` | Workspace provisioning logic |

---

## 3D Editor (PlayCanvas)

### Completed

- [x] **Auto-save hook** — 30s interval with `lib/scene/auto-save.ts`
- [x] **GLB/GLTF model loading** — Added to `lib/scene/loader.ts`
- [x] **External asset library connector** — `lib/ai/assetLibrary.ts` (PlayCanvas, Sketchfab, Poly Haven)
- [x] **AssetPicker UI** — Component for searching external assets (`components/engines/AssetPicker.tsx`)
- [x] **UserAssetLibrary UI** — Component for user's downloaded assets (`components/engines/UserAssetLibrary.tsx`)
- [x] **API routes** — `/api/assets/search` and `/api/assets/user`
- [x] **Container cleanup race fix** — Added ready signal + heartbeat to prevent premature pod deletion
- [x] **Cron cleanup endpoint** — `/api/playcanvas-isolation?action=cron_cleanup`
- [x] **CSP expansion** — Added vercel/cloudflare to frame-src and connect-src for iframe support
- [x] **Turbopack disabled** — Removed from next.config.js

### In Progress

- [ ] End-to-end test external asset search
- [ ] End-to-end test user download flow

### Pending

- [ ] Set up cron job on Hostinger: `*/15 * * * * curl -s https://dreammakerhub.website/api/playcanvas-isolation -X POST -d '{"action":"cron_cleanup"}'`

### Key Files

| File | Purpose |
|------|---------|
| `apps/web/lib/scene/auto-save.ts` | Auto-save hook + cleanSceneData |
| `apps/web/lib/scene/loader.ts` | Scene loader with GLB support |
| `apps/web/lib/ai/assetLibrary.ts` | External asset search connector |
| `apps/web/components/engines/AssetPicker.tsx` | External asset search UI |
| `apps/web/components/engines/UserAssetLibrary.tsx` | User downloads UI |
| `apps/web/app/api/assets/search/route.ts` | Asset search API |
| `apps/web/app/api/assets/user/route.ts` | User downloads API |
| `apps/web/app/library/page.tsx` | Library page with tabs |
| `apps/web/app/api/playcanvas-isolation/route.ts` | Container lifecycle + cron cleanup |
| `public/assets/` | Local asset folders |
| `templates/3d/` | Scene templates |
