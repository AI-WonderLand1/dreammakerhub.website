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

### DNS
- [x] **coder.dreammakerhub.website** — Points to OCI Load Balancer (direct, no Cloudflare tunnel)

### OCI Resource IDs
- Cluster: `ocid1.cluster.oc1.us-chicago-1.aaaaaaaakb4d4grfqla4lfxurzcp5y6j62lqpbtemxrtqfckpcmraeladnoa`
- Node Pool: `ocid1.nodepool.oc1.us-chicago-1.aaaaaaaaxjiyz4tf7qtafvwjiykjss5j25c2eppvlfqny3q52n537ptwnjbq`
- Bastion: `ocid1.bastion.oc1.us-chicago-1.amaaaaaadziiscia3wl7qacwnvgikdc7gzb5pn37ruskngzk3qw2ken7hlca`
- Compartment: `ocid1.tenancy.oc1..aaaaaaaa24524q6ybwpvtywhpatteelgsxcbv36zkp6uovifyg4ofeysfsgq`

---

## In Progress

### Coder Template Push
- [ ] **Bug: "Detecting persistent resources" timeout** — Coder v2 provisioner runs terraform in empty directory
  - Workaround: Use Coder web UI to create template manually, or fix provisioner configuration

### OCI Direct Access
- [ ] **Move Coder off localhost:3000** — Expose Coder via OCI Load Balancer
- [ ] **Configure wildcard DNS** — `*.coder.dreammakerhub.website` → OCI LB
- [ ] **Remove Cloudflare tunnel** — No longer needed, use OCI directly

---

## TODO — Features

- [ ] **Phase 1**: AI Builder → Puck (enhance AI chat to output Puck JSON)
- [ ] **Phase 4**: Git operations panel — commit/push/pull/sync API + UI
- [ ] **Phase 6**: Temp storage + 24hr warning modal
- [ ] **Phase 7**: BYOC integration (existing `lib/crypto/byoc.ts` + `StorageManager.ts`)
- [ ] **Phase 8**: Deploy & preview URLs

## Key Files Reference

| File | Purpose |
|------|---------|
| `infra/coder/template/main.tf` | Coder workspace template (Kubernetes) |
| `/etc/systemd/system/coder.service` | Coder systemd service config |
| `~/.kube/config` | Kubernetes config for OKE cluster |
| `apps/web/lib/workspace/provisioner.ts` | Workspace provisioning logic |
