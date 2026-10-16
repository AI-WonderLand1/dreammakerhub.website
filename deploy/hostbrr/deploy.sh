#!/usr/bin/env bash
# Manual, private-only HostBrr web deployment. No DNS changes, no public ports,
# no Coder/customer workspace provisioning, and no GPU workload.
set -euo pipefail

deploy_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$deploy_dir"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
have_env_key() {
  grep -Eq "^$1=[^[:space:]]" runtime.env
}
have_any_env_key() {
  local key
  for key in "$@"; do
    if have_env_key "$key"; then return 0; fi
  done
  return 1
}

command -v docker >/dev/null 2>&1 || fail 'Install Docker Engine and the Compose plugin first.'
command -v curl >/dev/null 2>&1 || fail 'Install curl first.'
docker compose version >/dev/null 2>&1 || fail 'Docker Compose v2 plugin is required.'
docker info >/dev/null 2>&1 || fail 'Docker daemon is not accessible to this user.'
[[ -f deployment.env && -f runtime.env ]] || fail 'Install deployment.env and runtime.env privately; see deploy/hostbrr/README.md.'
# Refuse a moving tag or arbitrary image repository.
grep -Eq '^WEB_IMAGE=ghcr\.io/ai-wonderland1/dreammakerhub-website:[0-9a-f]{40}$' deployment.env ||
  fail 'WEB_IMAGE must point to a verified 40-character SHA tag from the web-image workflow.'
# Never display or log credentials, including in "docker compose config".
have_env_key NEXT_PUBLIC_SUPABASE_URL || fail 'Missing NEXT_PUBLIC_SUPABASE_URL in runtime.env.'
have_any_env_key NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  fail 'Missing Supabase publishable/anon key in runtime.env.'
have_any_env_key SUPABASE_SERVICE_ROLE_KEY SUPABASE_SECRET_KEY ||
  fail 'Missing Supabase service key in runtime.env.'
have_env_key DATABASE_URL || fail 'Missing DATABASE_URL in runtime.env.'
chmod 600 runtime.env deployment.env

# Verify the configuration without printing the rendered Compose secrets.
docker compose --env-file deployment.env -f compose.yaml config --quiet

printf '%s\n' 'Pulling the pinned GHCR web image (no on-VPS build)...'
docker compose --env-file deployment.env -f compose.yaml pull web
printf '%s\n' 'Starting PRIVATE localhost-bound web container...'
docker compose --env-file deployment.env -f compose.yaml up -d --no-deps web

ready=0
for i in $(seq 1 45); do
  if curl --silent --show-error --fail --max-time 4 -o /dev/null http://127.0.0.1:5001/health 2>/dev/null; then
    ready=1
    break
  fi
  sleep 2
done
docker compose --env-file deployment.env -f compose.yaml ps web
[[ "$ready" -eq 1 ]] || fail 'Web health check failed. Inspect docker compose logs web (never paste logs containing secrets).'

config_status="$(curl --silent --max-time 8 -o /dev/null -w '%{http_code}' http://127.0.0.1:5001/api/config/supabase || true)"
[[ "$config_status" == "200" ]] ||
  fail "Supabase configuration route returned HTTP $config_status; keep the site private and fix runtime config."

homepage_status="$(curl --silent --max-time 10 -o /dev/null -w '%{http_code}' http://127.0.0.1:5001/ || true)"
[[ "$homepage_status" == "200" ]] ||
  fail "Homepage returned HTTP $homepage_status; keep the site private and investigate."

printf '%s\n' 'PASS: private HostBrr web health, Supabase config route, and homepage.'
printf '%s\n' 'Public DNS / HTTPS were NOT enabled. Coder, GPUs and billable feature flags remain off.'
