# Migration: Oracle OKE → Hostinger VPS + K3s

## Pre-Migration Checklist

### 1. Architecture Rebuild (ARM → x86_64)

Since Oracle uses ARM and Hostinger is AMD EPYC x86_64, rebuild all images:

```bash
# On your build machine (or GitHub Actions with ubuntu-latest)
docker buildx create --use

# Rebuild each engine for x86_64
docker buildx build --platform linux/amd64 -t yourname/puck-engine:latest --push .
docker buildx build --platform linux/amd64 -t yourname/playcanvas-engine:latest --push .
docker buildx build --platform linux/amd64 -t yourname/alice-orchestrator:latest --push .
docker buildx build --platform linux/amd64 -t yourname/rick-builder:latest --push .
docker buildx build --platform linux/amd64 -t yourname/theia-ide:latest --push .

# Update your K8s manifests to use these new registries
```

### 2. Export Data from Oracle

```bash
# SSH into Oracle instance
ssh ubuntu@YOUR_ORACLE_IP

# Database dump
pg_dump -h YOUR_OCI_DB_HOST -U postgres wonderspace_db > /tmp/wonderspace_backup.sql

# Coder workspaces (if self-hosted Coder)
# Find PV mount points
kubectl get pv -o json | jq '.items[].spec.hostPath.path'

# Rsync workspace data to Hostinger
rsync -avz --progress /var/lib/coder/workspace-data/ ubuntu@YOUR_HOSTINGER_IP:/tmp/coder-workspaces/

# Copy secrets (export for manual recreation)
kubectl get secrets -n default -o yaml > /tmp/k8s-secrets.yaml
# ⚠️  Move this securely, contains API keys
```

---

## Hostinger VPS Setup

### 1. Initial Server Setup (Ubuntu 24.04)

```bash
# SSH into new Hostinger VPS
ssh root@YOUR_HOSTINGER_IP

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser wonderuser
usermod -aG sudo wonderuser

# Install essentials
apt install -y curl wget git vim htop unzip fail2ban

# Set hostname
hostnamectl set-hostname dreammakerhub
```

### 2. Install CloudPanel

```bash
# Run CloudPanel installer
curl -sSL https://installer.cloudpanel.io/ce/v2/install.sh | sudo bash

# Access at: https://YOUR_HOSTINGER_IP:8443
# Create database in CloudPanel UI first
```

### 3. Install K3s (without Traefik, you'll use CloudPanel's Nginx)

```bash
# Install K3s without bundled Traefik
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --disable=traefik" sh -

# Add user to k3s group
sudo usermod -aG k3s wonderuser
sudo chown wonderuser:wonderuser /etc/rancher/k3s/k3s.yaml

# Setup kubeconfig
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown wonderuser:wonderuser ~/.kube/config
export KUBECONFIG=~/.kube/config

# Verify
kubectl get nodes
```

### 4. Install Kubectl & Helm

```bash
# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

---

## Deploy Your Stack

### 1. Create Namespaces

```bash
kubectl create namespace wonderspace
kubectl create namespace coder
```

### 2. Create Secrets

```bash
# Create secrets manually (don't commit these!)
kubectl create secret generic wonderspace-secrets \
  --namespace=wonderspace \
  --from-literal=OPENCODE_API_KEY=op-your-key \
  --from-literal=SUPABASE_URL=https://your-project.supabase.co \
  --from-literal=SUPABASE_KEY=your-anon-key \
  --from-literal=DATABASE_URL=postgres://user:pass@localhost:5432/wonderspace
```

### 3. Apply Your Manifests

```bash
# Clone your repo or upload manifests
git clone https://github.com/yourusername/psychic-octo-fishstick.git
cd psychic-octo-fishstick/infra/coder/

# Edit image references to use linux/amd64 versions
vim values.yaml

# Apply manifests
kubectl apply -k .  # if using Kustomize
# OR
kubectl apply -f your-engine-manifests/
```

### 4. Setup Ingress (CloudPanel → K3s)

```bash
# Install Nginx Ingress Controller for K3s
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Wait for it
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Get NodePort
kubectl get svc -n ingress-nginx
# Note the NodePort (e.g., 30080 for HTTP, 30443 for HTTPS)
```

### 5. CloudPanel Site Configuration

In CloudPanel UI:

1. **Create Site** → `dreammakerhub.website`
2. **Reverse Proxy** → Point to your K3s NodePort:
   ```
   proxy_pass http://127.0.0.1:30080;
   proxy_set_header Host $host;
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```
3. **Enable SSL** → Let's Encrypt auto

---

## Restore Data

### 1. Database Restore

```bash
# Copy backup to server
scp /tmp/wonderspace_backup.sql wonderuser@YOUR_HOSTINGER_IP:/tmp/

# SSH and restore
ssh wonderuser@YOUR_HOSTINGER_IP
sudo -u postgres psql -c "CREATE DATABASE wonderspace_db;"
sudo -u postgres psql wonderspace_db < /tmp/wonderspace_backup.sql
```

### 2. Coder Workspaces (if applicable)

```bash
# Restore workspace data to persistent volume
sudo mkdir -p /var/lib/rancher/k3s/storage/coder-workspaces
sudo cp -r /tmp/coder-workspaces/* /var/lib/rancher/k3s/storage/coder-workspaces/
sudo chown -R 1000:1000 /var/lib/rancher/k3s/storage/coder-workspaces/
```

---

## VPN Setup (Tailscale Recommended)

### 1. Install Tailscale

```bash
# On Hostinger VPS
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Copy auth link and authorize in Tailscale admin console
```

### 2. Install on Chromebook (Crostini)

```bash
# In your Chromebook Linux terminal
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Now you have a direct tunnel to your VPS
# Access Coder IDE via Tailscale IP (100.x.x.x) instead of public IP
```

### 3. Lock Down CloudPanel

```bash
# Get your Tailscale IP
tailscale ip -4
# Returns something like: 100.64.123.45
```

In CloudPanel:
- Settings → Security → **Restrict access to CloudPanel from fixed IP addresses**
- Add: `100.64.123.45/32`

---

## DNS Update (IONOS)

1. Login to IONOS
2. Go to **Domains** → `dreammakerhub.website` → DNS
3. Update A Record:
   - Name: `@` (root) and `*`
   - Value: `YOUR_HOSTINGER_IP`
   - TTL: 3600
4. Wait for propagation: `dig dreammakerhub.website`

---

## Post-Migration Verification

```bash
# Check all pods are running
kubectl get pods --all-namespaces

# Check ingress
kubectl get ingress -n wonderspace

# Test endpoints
curl -I http://dreammakerhub.website
curl -I https://dreammakerhub.website

# Check logs
kubectl logs -n wonderspace deployment/alice-orchestrator
kubectl logs -n wonderspace deployment/puck-engine

# Test VPN access (from Chromebook)
tailscale ping dreammakerhub  # or VPS tailscale IP
```

---

## Rollback Plan (if needed)

If something breaks:

1. **Immediate**: Change IONOS DNS A record back to Oracle IP
2. **Keep Oracle running** until you're 100% sure Hostinger is stable
3. **DNS TTL**: Set to 300 (5 min) during migration for fast switching

---

## Cost Optimization Tips

With your $87.95 budget:

- **Container Registry**: Use GitHub Container Registry (ghcr.io) - free for public, cheap for private
- **Backups**: Set up automated `pg_dump` cron job to /tmp, then rsync to Google Drive or Dropbox
- **Monitoring**: Use `kubectl top` + CloudPanel stats instead of paid monitoring
- **SSL**: CloudPanel Let's Encrypt is free and auto-renews

---

## Next Steps After Migration

1. ✅ Test all 5 engines (Puck, PlayCanvas, Alice, Rick, Theia)
2. ✅ Run release gates: `bash scripts/release-gates-check.sh`
3. ✅ Verify Coder IDE access via Tailscale
4. ✅ Set up automated backups
5. ✅ Terminate Oracle resources (once stable for 1 week)

Need help with any specific step?
