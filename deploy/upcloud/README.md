# UpCloud Deployment — DreamMakerHub

Migrate from Civo (K8s) + AWS (EC2) + Railway to UpCloud via Docker Compose.

## Architecture

```
Cloudflare (DNS + proxy)
    │
    ▼
UpCloud VM dreammakerhub-01 (152.44.43.125, us-chi1)
    ├── nginx (reverse proxy, port 80/443)
    │   ├── dreammakerhub.website / www / play / playground / wonderplay-3d / civo-test → web:5000
    │   ├── ai.dreammakerhub.website → web:5000
    │   ├── coder.dreammakerhub.website / ide / *.coder → coder:7080
    ├── coder (ghcr.io/coder/coder:v2.32.0)
    ├── coder-db (postgres:16-alpine)
    ├── web (Next.js, Dockerfile)
    ├── optimizer (GLTF optimization, port 3090)
    ├── certbot (TLS renewal via DNS-01 Cloudflare)
    └── Supabase (external — auth + database)
```

## Current DNS Status

**Already migrated:**
- `coder.dreammakerhub.website` → `152.44.43.125` ✅
- `*.coder.dreammakerhub.website` → `152.44.43.125` ✅

**Still on Railway (need to update):**
- `dreammakerhub.website` → `7vpygisx.up.railway.app` ❌
- `www.dreammakerhub.website` → `jb8nxndd.up.railway.app` ❌
- `ide.dreammakerhub.website` → `jb8nxndd.up.railway.app` ❌
- `play.dreammakerhub.website` → `jb8nxndd.up.railway.app` ❌
- `playground.dreammakerhub.website` → `jb8nxndd.up.railway.app` ❌
- `wonderplay-3d.dreammakerhub.website` → `hikmei1d.up.railway.app` ❌
- `civo-test.dreammakerhub.website` → `jb8nxndd.up.railway.app` ❌

## Prerequisites

1. **UpCloud VM** already provisioned (`dreammakerhub-01`, IP `152.44.43.125`, us-chi1)
2. **Cloudflare zone ID** — get it: `curl -s -X GET "https://api.cloudflare.com/client/v4/zones" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | python3 -m json.tool`
3. **GitHub secrets** configured:
   - `UPCLOUD_SERVER_IP` = `152.44.43.125`
   - `UPCLOUD_SSH_USER` = `ubuntu`
   - `UPLOAD_SSH_KEY` = your `~/.ssh/id_ed25519` private key
   - `UPCLOUD_API_KEY` = your UpCloud API key
   - `CLOUDFLARE_API_TOKEN` = Cloudflare API token for DNS-01
   - `CLOUDFLARE_ZONE_ID` = your Cloudflare zone ID
   - `LETSENCRYPT_EMAIL` = email for TLS certs
4. **SSH key** `dreammakerhub-coder` already on server
5. **`apps/web/.env.production`** with real Supabase/AI keys

## Step 1 — Update Cloudflare DNS

### Option A: Automatic (script)
```bash
export CLOUDFLARE_ZONE_ID=your-zone-id
export CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
bash deploy/upcloud/scripts/update-cloudflare-dns.sh
```

### Option B: Manual — copy-paste these curl commands
```bash
# Get zone ID first
curl -s -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | python3 -m json.tool

# Delete CNAME + create A record for each subdomain
# Example for dreammakerhub.website:
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/<record-id>" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json"
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"A","name":"dreammakerhub.website","content":"152.44.43.125","ttl":1,"proxied":true}'

# Repeat for: www, ide, play, playground, wonderplay-3d, civo-test
```

### Option C: Cloudflare Dashboard
Go to **Traffic → DNS** and manually replace the CNAME records with A records pointing to `152.44.43.125`:
- `dreammakerhub.website` → A → `152.44.43.125` (orange-cloud ON)
- `www.dreammakerhub.website` → A → `152.44.43.125`
- `ide.dreammakerhub.website` → A → `152.44.43.125`
- `play.dreammakerhub.website` → A → `152.44.43.125`
- `playground.dreammakerhub.website` → A → `152.44.43.125`
- `wonderplay-3d.dreammakerhub.website` → A → `152.44.43.125`
- `civo-test.dreammakerhub.website` → A → `152.44.43.125`

## Step 2 — Deploy

```bash
# 1. Copy env template and edit with real values
cp deploy/upcloud/.env.example .env

# 2. Deploy via SSH
export UPCLOUD_SERVER_IP=152.44.43.125
bash deploy/upcloud/vm-deploy-docker.sh

# 3. Verify
curl https://dreammakerhub.website
curl https://coder.dreammakerhub.website
```

## Manual Deploy (on server)

```bash
ssh ubuntu@152.44.43.125
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
git clone https://github.com/<USER>/dreammakerhub.website.git
cd dreammakerhub.website
cp deploy/upcloud/.env.example .env
# Edit .env with real Supabase/AI keys
docker compose -f deploy/upcloud/docker-compose.yml up -d --build
docker compose ps
docker compose logs -f
```

## Deploy via GitHub Actions

Push to `main` branch — GitHub Actions automatically deploys to UpCloud.

## Services

| Service | Port | URL |
|---------|------|-----|
| Main Website | 5000 → 80/443 | `dreammakerhub.website` |
| AI Playground | 5000 → 80/443 | `ai.dreammakerhub.website` |
| Play | 5000 → 80/443 | `play.dreammakerhub.website` |
| Playground | 5000 → 80/443 | `playground.dreammakerhub.website` |
| WonderPlay 3D | 5000 → 80/443 | `wonderplay-3d.dreammakerhub.website` |
| Civo Test | 5000 → 80/443 | `civo-test.dreammakerhub.website` |
| Coder IDE | 7080 → 443 | `coder.dreammakerhub.website` |
| Web IDE | 7080 → 443 | `ide.dreammakerhub.website` |
| Wildcard IDEs | 7080 → 443 | `*.coder.dreammakerhub.website` |
| Optimizer | 3090 | (internal) |
| PostgreSQL | 5432 | (internal) |

## TLS Certificates

Certificates are obtained via **DNS-01 challenge** using Cloudflare API token. Certbot auto-renews every 12h. TLS challenge TXT records already exist in Cloudflare (`_acme-challenge.*`).

## Rollback

Keep Civo and AWS running until verified:
```bash
# Stop UpCloud deploy
docker compose -f deploy/upcloud/docker-compose.yml down

# Revert Cloudflare DNS to Railway CNAMEs
```

## Clean Up Old Providers

After 48h verification:
```bash
# Civo K8s
./deploy/civo/deploy.sh delete

# AWS EC2 — terminate instance
```

## Cost

UpCloud VM (2xCPU/4GB): ~€0.012/hr ≈ ~€9/month — well within 500€ trial.