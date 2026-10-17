#!/usr/bin/env bash
# Executed remotely by the approved GitHub Actions deployment workflow.
# No git resets, builds, database migrations, Caddy changes, or DNS changes.
set -euo pipefail

if [[ $# -ne 1 || ! "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: bash update-web.sh <successful-40-character-Master-image-SHA>" >&2
  exit 2
fi

image_sha="$1"
new_image="ghcr.io/ai-wonderland1/dreammakerhub-website:$image_sha"
deploy_dir="/home/wonderland/hostbrr-web-staging/deploy/hostbrr"

cd "$deploy_dir" || exit 1
[[ -f runtime.env && -f deployment.env && -f compose.yaml && -f deploy.sh ]] || {
  echo "HostBrr deployment files are missing. Leave the running site unchanged." >&2
  exit 1
}

old_image="$(sed -n 's/^WEB_IMAGE=//p' deployment.env | head -n 1)"
[[ "$old_image" =~ ^ghcr\.io/ai-wonderland1/dreammakerhub-website:[0-9a-f]{40}$ ]] || {
  echo "Existing deployment image pin is invalid. No change made." >&2
  exit 1
}

write_image_pin() {
  local tmp
  tmp="$(mktemp "$deploy_dir/.deployment.env.XXXXXXXX")"
  printf 'WEB_IMAGE=%s\n' "$1" > "$tmp"
  chmod 600 "$tmp"
  mv -f "$tmp" "$deploy_dir/deployment.env"
}

verify_build_header() {
  curl -fsSI --max-time 10 http://127.0.0.1:5001/ |
    tr -d '\r' |
    grep -Fqi "x-dreammaker-build: $image_sha"
}

echo "Checking/pulling approved image on HostBrr..."
docker pull "$new_image" >/dev/null

if [[ "$old_image" != "$new_image" ]]; then
  write_image_pin "$new_image"
fi

# Uses the existing local runtime.env; replaces ONLY the web service, leaving
# the working Caddy HTTPS container, volumes and other containers untouched.
if ! (bash deploy.sh && verify_build_header); then
  echo "New image did not pass health/build verification. Restoring previous image..." >&2
  write_image_pin "$old_image"
  if ! bash deploy.sh; then
    echo "URGENT: automatic rollback also failed; inspect HostBrr containers." >&2
  fi
  exit 1
fi

echo "SUCCESS: HostBrr web updated and matching x-dreammaker-build header verified."
echo "No DNS, Caddy, Stripe, Supabase database or other repositories changed."
