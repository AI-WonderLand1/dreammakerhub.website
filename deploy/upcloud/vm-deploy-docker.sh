#!/usr/bin/env bash
# deploy/upcloud/vm-deploy-docker.sh — Deploy all services via Docker Compose on UpCloud
#
# Prerequisites:
#   - SSH access to UpCloud VM (152.44.43.125)
#   - apps/web/.env.production with real values
#   - Docker and Docker Compose installed on VM
#
# Usage (run locally):
#   export UPCLOUD_SERVER_IP=152.44.43.125
#   export UPCLOUD_SSH_USER=ubuntu
#   bash deploy/upcloud/vm-deploy-docker.sh

set -uo pipefail

SERVER_IP="${UPCLOUD_SERVER_IP:-152.44.43.125}"
SSH_USER="${UPCLOUD_SSH_USER:-ubuntu}"
DOMAIN="${DOMAIN:-dreammakerhub.website}"
EMAIL="${EMAIL:-aiwonderland111@gmail.com}"
REPO_PATH="/home/${SSH_USER}/dreammakerhub.website"

echo "=== [$(date -u)] UpCloud Docker deployment start ==="
echo "Server: ${SERVER_IP}"
echo "Domain: ${DOMAIN}"

# 1. Copy repo to server
echo "=== Step 1: Sync repo to server ==="
ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP} << EOF
  sudo apt-get update -y
  sudo apt-get install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx curl
  sudo usermod -aG docker ${SSH_USER} || true

  if [ ! -d "${REPO_PATH}" ]; then
    git clone https://github.com/<USER>/dreammakerhub.website.git ${REPO_PATH}
  else
    cd ${REPO_PATH} && git pull origin main
  fi
EOF

# 2. Copy .env.production
echo "=== Step 2: Copy environment file ==="
if [ -f "apps/web/.env.production" ]; then
  scp -o StrictHostKeyChecking=no apps/web/.env.production ${SSH_USER}@${SERVER_IP}:${REPO_PATH}/apps/web/.env.production
else
  echo "WARNING: apps/web/.env.production not found locally. You'll need to set it up on the server."
fi

# 3. Build and start services
echo "=== Step 3: Build and deploy Docker services ==="
ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP} << EOF
  cd ${REPO_PATH}

  # Copy .env from .env.example
  cp deploy/upcloud/.env.example .env

  # Build and start
  docker compose -f deploy/upcloud/docker-compose.yml up -d --build

  echo "=== Docker services started ==="
  docker ps
EOF

# 4. Setup certbot challenge directory
echo "=== Step 4: Setup certbot challenge directory ==="
ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP} << EOF
  sudo mkdir -p /var/www/certbot
  sudo chown -R www-data:www-data /var/www/certbot
  mkdir -p ${REPO_PATH}/certbot
  mkdir -p ${REPO_PATH}/certs
EOF

# 5. TLS certificates (DNS-01 via Cloudflare)
echo "=== Step 5: Request TLS certificates via DNS-01 ==="
ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP} << EOF
  cd ${REPO_PATH}

  # Run certbot once to get initial certs
  docker run --rm \
    -v \${PWD}/certs:/etc/letsencrypt \
    -v \${PWD}/cloudflare.ini:/etc/letsencrypt/cloudflare.ini:ro \
    -e CF_API_TOKEN=\${CLOUDFLARE_API_TOKEN} \
    certbot/certbot certonly --dns-cloudflare \
    --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
    --dns-cloudflare-propagation-seconds 60 \
    --non-interactive --agree-tos \
    -m ${EMAIL} \
    -d ${DOMAIN} -d www.${DOMAIN} \
    -d coder.${DOMAIN} -d ide.${DOMAIN} \
    -d *.coder.${DOMAIN} \
    -d ai.${DOMAIN} || echo "Initial cert generation failed, will retry via certbot container"
EOF

# 6. Restart services
echo "=== Step 6: Restart services ==="
ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP} << EOF
  cd ${REPO_PATH}
  docker compose -f deploy/upcloud/docker-compose.yml restart nginx certbot
EOF

echo "=== UpCloud Docker deployment done ==="
echo "DNS records still need to point to ${SERVER_IP} in Cloudflare"