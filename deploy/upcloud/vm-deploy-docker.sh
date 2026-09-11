#!/usr/bin/env bash
# Safe UpCloud web redeploy helper.
#
# Production secrets are managed by GitHub Actions in
# .github/workflows/deploy-upcloud.yml. That workflow writes the generated
# environment bundle to /opt/dreammakerhub.website/.env with mode 600.
#
# This helper NEVER creates, copies, prints, or downloads secrets. It only
# redeploys the web image using the production .env already installed by the
# GitHub Actions deployment.
#
# Usage on the UpCloud VM:
#   sudo bash /opt/dreammakerhub.website/deploy/upcloud/vm-deploy-docker.sh
#
# Optional override:
#   APP_DIR=/opt/dreammakerhub.website sudo -E bash deploy/upcloud/vm-deploy-docker.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/dreammakerhub.website}"
BRANCH="${BRANCH:-Master}"
COMPOSE_FILE="$APP_DIR/deploy/upcloud/docker-compose.web.yml"
ENV_FILE="$APP_DIR/.env"
PUBLIC_URL="${PUBLIC_URL:-https://dreammakerhub.website}"

echo "=== DreamMakerHub UpCloud web redeploy ==="
echo "App directory: $APP_DIR"
echo "Branch: $BRANCH"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "ERROR: $APP_DIR is not a Git checkout."
  echo "Run the GitHub Actions workflow 'Deploy Main Site to UpCloud VM' first."
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: Missing Compose file: $COMPOSE_FILE"
  exit 1
fi

if [ ! -s "$ENV_FILE" ]; then
  echo "ERROR: Missing production environment file: $ENV_FILE"
  echo "Do not create it from .env.example."
  echo "Run the GitHub Actions deployment so GitHub Secrets can install it safely."
  exit 1
fi

# Do not print environment values. Only confirm the file is present.
chmod 600 "$ENV_FILE"
echo "Production environment file: present"

# Keep the production checkout identical to the GitHub branch used by CI/CD.
git -C "$APP_DIR" fetch origin "$BRANCH"
git -C "$APP_DIR" reset --hard "origin/$BRANCH"

cd "$APP_DIR"

# The web-only Compose file reads ../../.env, which resolves to $APP_DIR/.env.
docker compose -f "$COMPOSE_FILE" pull web
docker compose -f "$COMPOSE_FILE" up -d --force-recreate --remove-orphans web

echo
echo "=== Container status ==="
docker compose -f "$COMPOSE_FILE" ps web

echo
echo "=== Local health check ==="
docker exec dreammaker-web sh -c 'curl -fsS http://127.0.0.1:5000/health >/dev/null'
echo "Health endpoint: OK"

echo
echo "=== Supabase config route check ==="
status="$(curl -sS -o /tmp/dreammakerhub-supabase-check.json -w '%{http_code}' "$PUBLIC_URL/api/config/supabase")"
if [ "$status" = "404" ]; then
  echo "ERROR: $PUBLIC_URL/api/config/supabase still returns 404."
  echo "The public site is not serving the expected build."
  rm -f /tmp/dreammakerhub-supabase-check.json
  exit 1
fi
rm -f /tmp/dreammakerhub-supabase-check.json
echo "Supabase config route HTTP status: $status"

echo
echo "=== Public homepage check ==="
curl --fail --show-error --silent "$PUBLIC_URL/" >/dev/null
echo "Homepage: OK"

echo
echo "Redeploy complete. Secrets remained in the GitHub-managed production .env and were not printed."
