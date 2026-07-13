#!/usr/bin/env bash
# deploy/deploy.sh — run ON the AWS EC2 instance (Instance Connect shell)
# Deploys the Next.js site on AWS (nginx + pm2) and proxies the 3D engine
# (PlayCanvas / WebGLStudio) to your LightningAI Kubernetes ingress.
#
# Usage:
#   LIGHTNING_3D_URL=https://3d.your-lightning-ingress.example \
#   ENABLE_TLS=true \
#   EMAIL=aiwonderland111@gmail.com \
#   ./deploy.sh
#
# Env:
#   LIGHTNING_3D_URL  Base URL of the LightningAI kub serving /webglstudio and /playcanvas.
#                     If empty, the 3D assets are served locally from apps/web/public (fallback).
#   ENABLE_TLS        "true" to obtain + use a Let's Encrypt cert for the domain (default: false).
#   EMAIL             Contact email for certbot (required when ENABLE_TLS=true).
#   DOMAIN            Public domain (default: dreammakerhub.website).
set -uo pipefail
LOG=/home/ubuntu/deploy.log
exec > >(tee -a "$LOG") 2>&1
echo "=== [$(date -u)] deploy start ==="

export DEBIAN_FRONTEND=noninteractive
REPO=/home/user/dreammakerhub.website
cd "$REPO"

DOMAIN="${DOMAIN:-dreammakerhub.website}"
LIGHTNING_3D_URL="${LIGHTNING_3D_URL:-}"
ENABLE_TLS="${ENABLE_TLS:-false}"
EMAIL="${EMAIL:-aiwonderland111@gmail.com}"

# 1. system packages
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo npm i -g pm2 || true

# 2. install deps + build the web app
#    Build uses apps/web/.env.production (real Supabase keys already there).
npm install --legacy-peer-deps
npm run build --workspace=ai-wonder-web

# 3. runtime env — DO NOT overwrite real values from .env.production.
#    Only ensure NEXTAUTH_SECRET exists and record the 3D engine URL.
WEB_ENV="$REPO/apps/web/.env.production"
if [ ! -f "$WEB_ENV" ]; then
  echo "ERROR: $WEB_ENV missing — create it with real Supabase/AI keys first." >&2
  exit 1
fi

# Ensure a NEXTAUTH_SECRET is present (append if missing)
if ! grep -q '^NEXTAUTH_SECRET=' "$WEB_ENV"; then
  printf 'NEXTAUTH_SECRET=%s\n' "$(openssl rand -base64 32)" >> "$WEB_ENV"
fi

# Record the LightningAI 3D engine URL for the running process (runtime-only).
# NEXT_PUBLIC_* must be present at build time; .env.production already wins for build.
if [ -n "$LIGHTNING_3D_URL" ]; then
  # strip any trailing slash
  LIGHTNING_3D_URL="${LIGHTNING_3D_URL%/}"
  if grep -q '^NEXT_PUBLIC_3D_ENGINE_URL=' "$WEB_ENV"; then
    sed -i "s#^NEXT_PUBLIC_3D_ENGINE_URL=.*#NEXT_PUBLIC_3D_ENGINE_URL=$LIGHTNING_3D_URL#" "$WEB_ENV"
  else
    printf 'NEXT_PUBLIC_3D_ENGINE_URL=%s\n' "$LIGHTNING_3D_URL" >> "$WEB_ENV"
  fi
fi

# 4. start app with pm2
cd "$REPO/apps/web"
pm2 delete dreammaker-web 2>/dev/null || true
pm2 start npm --name dreammaker-web -- start
pm2 save

# 5. nginx — assemble config from conditional parts into a temp file
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
    # HTTP -> HTTPS redirect, real TLS in the 443 block below
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

  if [ -n "$LIGHTNING_3D_URL" ]; then
    echo "    # 3D engine + editor served from LightningAI kub"
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
rm -f "$TMPNG"

sudo ln -sf "$NG" /etc/nginx/sites-enabled/dreammakerhub

# Obtain TLS cert if requested
if [ "$ENABLE_TLS" = "true" ]; then
  echo "=== requesting TLS cert via certbot ==="
  sudo certbot --nginx -n --agree-tos -m "$EMAIL" -d "$DOMAIN" -d "www.$DOMAIN" \
    || echo "certbot failed — check DNS + port 80 reachability, then re-run with ENABLE_TLS=true"
fi

sudo nginx -t && sudo systemctl enable --now nginx && sudo systemctl reload nginx

echo "=== local checks ==="
curl -sS -o /dev/null -w "app :5000 -> %{http_code}\n" http://127.0.0.1:5000 || true
curl -sS -o /dev/null -w "nginx :80 -> %{http_code}\n" http://127.0.0.1:80 || true
[ -n "$LIGHTNING_3D_URL" ] && curl -sS -o /dev/null -w "3d proxy -> %{http_code}\n" "http://127.0.0.1/webglstudio/direct-bootstrap.js" || true
echo "=== deploy done (log: $LOG) ==="
