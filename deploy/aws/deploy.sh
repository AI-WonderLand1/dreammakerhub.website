#!/usr/bin/env bash
# deploy/aws/deploy.sh — Deploy main website and services to AWS EC2
#
# Components deployed:
#   - Main website (Next.js)
#   - AI Playground
#   - Optimizer
#   - Supporting services
#
# Prerequisites:
#   - SSH access to EC2 instance
#   - apps/web/.env.production with real values
#
# Usage:
#   On EC2 instance:
#   LIGHTNING_3D_URL=https://<lightning-ingress> \
#   ENABLE_TLS=true \
#   EMAIL=aiwonderland111@gmail.com \
#   ./deploy/aws/deploy.sh

set -uo pipefail
LOG=/home/ubuntu/deploy.log
exec > >(tee -a "$LOG") 2>&1
echo "=== [$(date -u)] AWS deployment start ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

export DEBIAN_FRONTEND=noninteractive

DOMAIN="${DOMAIN:-dreammakerhub.website}"
LIGHTNING_3D_URL="${LIGHTNING_3D_URL:-}"
ENABLE_TLS="${ENABLE_TLS:-false}"
EMAIL="${EMAIL:-aiwonderland111@gmail.com}"

# 1. System packages
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo npm i -g pm2 || true

# 2. Install deps + build the web app
cd "$REPO_ROOT"
npm install --legacy-peer-deps
npm run build --workspace=ai-wonder-web

# 3. Runtime env
WEB_ENV="$REPO_ROOT/apps/web/.env.production"
if [ ! -f "$WEB_ENV" ]; then
  echo "ERROR: $WEB_ENV missing — create it with real Supabase/AI keys first." >&2
  exit 1
fi

# Ensure NEXTAUTH_SECRET exists
if ! grep -q '^NEXTAUTH_SECRET=' "$WEB_ENV"; then
  printf 'NEXTAUTH_SECRET=%s\n' "$(openssl rand -base64 32)" >> "$WEB_ENV"
fi

# Record LightningAI 3D engine URL
if [ -n "$LIGHTNING_3D_URL" ]; then
  LIGHTNING_3D_URL="${LIGHTNING_3D_URL%/}"
  if grep -q '^NEXT_PUBLIC_3D_ENGINE_URL=' "$WEB_ENV"; then
    sed -i "s#^NEXT_PUBLIC_3D_ENGINE_URL=.*#NEXT_PUBLIC_3D_ENGINE_URL=$LIGHTNING_3D_URL#" "$WEB_ENV"
  else
    printf 'NEXT_PUBLIC_3D_ENGINE_URL=%s\n' "$LIGHTNING_3D_URL" >> "$WEB_ENV"
  fi
fi

# 4. Start app with pm2
cd "$REPO_ROOT/apps/web"
pm2 delete dreammaker-web 2>/dev/null || true
pm2 start npm --name dreammaker-web -- start
pm2 save

# 5. Nginx configuration
sudo rm -f /etc/nginx/sites-enabled/default
NG=/etc/nginx/sites-available/dreammakerhub

{
  echo "server {"
  echo "    listen 80;"
  echo "    server_name $DOMAIN www.$DOMAIN;"
  echo "    client_max_body_size 50m;"
  echo ""
  echo "    location /.well-known/acme-challenge/ {"
  echo "        root /var/www/certbot;"
  echo "    }"
  echo ""

  if [ "$ENABLE_TLS" = "true" ]; then
    echo "    location / {"
    echo "        return 301 https://\$host\$request_uri;"
    echo "    }"
    echo "}"
    echo "server {"
    echo "    listen 443 ssl http2;"
    echo "    server_name $DOMAIN www.$DOMAIN;"
    echo "    client_max_body_size 50m;"
    echo ""
    echo "    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;"
    echo "    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;"
    echo ""
  fi

  # Proxy 3D engine to LightningAI
  if [ -n "$LIGHTNING_3D_URL" ]; then
    echo "    # 3D engine served from LightningAI"
    echo "    location /webglstudio/ {"
    echo "        proxy_pass $LIGHTNING_3D_URL/webglstudio/;"
    echo "        proxy_http_version 1.1;"
    echo "        proxy_set_header Host \$host;"
    echo "        proxy_set_header X-Real-IP \$remote_addr;"
    echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "    }"
    echo "    location /playcanvas/ {"
    echo "        proxy_pass $LIGHTNING_3D_URL/playcanvas/;"
    echo "        proxy_http_version 1.1;"
    echo "        proxy_set_header Host \$host;"
    echo "        proxy_set_header X-Real-IP \$remote_addr;"
    echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "    }"
    echo ""
  fi

  # Main website
  echo "    location / {"
  echo "        proxy_pass http://127.0.0.1:5000;"
  echo "        proxy_http_version 1.1;"
  echo "        proxy_set_header Host \$host;"
  echo "        proxy_set_header X-Real-IP \$remote_addr;"
  echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
  echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
  echo "        proxy_set_header Upgrade \$http_upgrade;"
  echo "        proxy_set_header Connection \"upgrade\";"
  echo "    }"
  echo "}"
} | sudo tee "$NG" >/dev/null

sudo ln -sf "$NG" /etc/nginx/sites-enabled/dreammakerhub

# 6. TLS cert
if [ "$ENABLE_TLS" = "true" ]; then
  echo "=== Requesting TLS cert via certbot ==="
  sudo certbot --nginx -n --agree-tos -m "$EMAIL" -d "$DOMAIN" -d "www.$DOMAIN" \
    || echo "certbot failed — check DNS + port 80 reachability"
fi

sudo nginx -t && sudo systemctl enable --now nginx && sudo systemctl reload nginx

# 7. Local checks
echo "=== Local checks ==="
curl -sS -o /dev/null -w "app :5000 -> %{http_code}\n" http://127.0.0.1:5000 || true
curl -sS -o /dev/null -w "nginx :80 -> %{http_code}\n" http://127.0.0.1:80 || true
[ -n "$LIGHTNING_3D_URL" ] && curl -sS -o /dev/null -w "3d proxy -> %{http_code}\n" "http://127.0.0.1/webglstudio/direct-bootstrap.js" || true

echo "=== AWS deployment done (log: $LOG) ==="
