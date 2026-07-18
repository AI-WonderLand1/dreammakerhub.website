#!/usr/bin/env bash
# deploy/deploy.sh — run ON the AWS EC2 instance (Instance Connect shell)
# Deploys the Next.js site on AWS (nginx + pm2).
#
# Usage:
#   ENABLE_TLS=true \
#   EMAIL=aiwonderland111@gmail.com \
#   ./deploy.sh
#
# Env:
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
ENABLE_TLS="${ENABLE_TLS:-false}"
EMAIL="${EMAIL:-aiwonderland111@gmail.com}"

# 1. system packages
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo npm i -g pm2 || true

# 2. install deps + build the web app
npm install --legacy-peer-deps
npm run build --workspace=ai-wonder-web

# 3. runtime env
WEB_ENV="$REPO/apps/web/.env.production"
if [ ! -f "$WEB_ENV" ]; then
  echo "ERROR: $WEB_ENV missing — create it with real Supabase/AI keys first." >&2
  exit 1
fi

if ! grep -q '^NEXTAUTH_SECRET=' "$WEB_ENV"; then
  printf 'NEXTAUTH_SECRET=%s\n' "$(openssl rand -base64 32)" >> "$WEB_ENV"
fi

# 4. start app with pm2
cd "$REPO/apps/web"
pm2 delete dreammaker-web 2>/dev/null || true
pm2 start npm --name dreammaker-web --start
pm2 save

# 5. nginx
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

if [ "$ENABLE_TLS" = "true" ]; then
  echo "=== requesting TLS cert via certbot ==="
  sudo certbot --nginx -n --agree-tos -m "$EMAIL" -d "$DOMAIN" -d "www.$DOMAIN" \
    || echo "certbot failed — check DNS + port 80 reachability, then re-run with ENABLE_TLS=true"
fi

sudo nginx -t && sudo systemctl enable --now nginx && sudo systemctl reload nginx

echo "=== local checks ==="
curl -sS -o /dev/null -w "app :5000 -> %{http_code}\n" http://127.0.0.1:5000 || true
curl -sS -o /dev/null -w "nginx :80 -> %{http_code}\n" http://127.0.0.1:80 || true
echo "=== deploy done (log: $LOG) ==="
