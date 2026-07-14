# AWS Deployment — Main Website & Services

This directory contains deployment scripts for all AWS EC2 hosted components.

## Components

| Component | Port | Description |
|-----------|------|-------------|
| Main Website | 5000 | Next.js frontend & API |
| AI Playground | 3000 | AI-powered development tools |
| Optimizer | 3090 | Resource optimization service |

## DNS Configuration

Set these DNS records to point to your EC2 public IP:

```
dreammakerhub.website    -> <EC2 public IP>
www.dreammakerhub.website -> <EC2 public IP>
ai.dreammakerhub.website -> <EC2 public IP>
```

## Deployment

```bash
# On EC2 instance
LIGHTNING_3D_URL=https://<lightning-ingress> \
ENABLE_TLS=true \
EMAIL=aiwonderland111@gmail.com \
./deploy/aws/deploy.sh
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `LIGHTNING_3D_URL` | LightningAI ingress URL for 3D engine proxy | No |
| `ENABLE_TLS` | Enable Let's Encrypt TLS certificates | No |
| `EMAIL` | Contact email for certbot | Yes (if TLS) |
| `DOMAIN` | Public domain (default: dreammakerhub.website) | No |

## Prerequisites

- SSH access to EC2 instance
- `apps/web/.env.production` with real Supabase/AI keys (git-ignored)
- Cloudflare proxy enabled for DNS records
- Security group allows inbound 80 + 443

## Helper Scripts

- `deploy/fix-access.sh` — Diagnoses and fixes firewall access issues
- `deploy/setup-website.sh` — Legacy setup (superseded by deploy.sh)
