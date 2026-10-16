#!/usr/bin/env bash
# Manual, immutable satellite release from GitHub Actions.
# DOES NOT restart the website or Caddy, modify DNS, or touch database.
set -euo pipefail

if [[ $# -ne 2 || ! "$2" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'Usage: update-satellite.sh playground|npc <40-char-built-sha>' >&2
  exit 2
fi
case "$1" in
  playground)
    service=playground
    key=PLAYGROUND_IMAGE
    image_repo=ghcr.io/ai-wonderland1/ai-playground
    port=5002
    ;;
  npc)
    service=npc
    key=NPC_IMAGE
    image_repo=ghcr.io/ai-wonderland1/npc-ai-sim
    port=5003
    ;;
  *) echo 'Unknown satellite service' >&2; exit 2 ;;
esac

cd /home/wonderland/hostbrr-web-staging/deploy/hostbrr
for required in deployment.env satellites.env compose.yaml compose.public.yaml compose.satellites.yaml; do
  test -f "$required" || { echo "Missing $required" >&2; exit 1; }
done
test -f "$service.runtime.env" || {
  echo "Missing $service.runtime.env: create a chmod-600 empty file for UI-only staged testing." >&2
  exit 1
}
test "$(stat -c '%a' "$service.runtime.env")" = 600 || {
  echo "$service.runtime.env must be chmod 600" >&2; exit 1;
}

old_image="$(sed -n "s/^$key=//p" satellites.env | head -n 1)"
[[ "$old_image" =~ ^ghcr\.io/ai-wonderland1/(ai-playground|npc-ai-sim):[0-9a-f]{40}$ ]] || {
  echo "Existing $key is missing or is not an immutable image pin" >&2
  exit 1
}
new_image="$image_repo:$2"

compose() {
  docker compose --env-file deployment.env --env-file satellites.env \
    -f compose.yaml -f compose.public.yaml -f compose.satellites.yaml "$@"
}
set_pin() {
  local tmp
  tmp="$(mktemp ./.satellites.env.XXXXXXXX)"
  sed -E "s|^$key=.*$|$key=$1|" satellites.env > "$tmp"
  chmod 600 "$tmp"
  mv -f "$tmp" satellites.env
}

echo "Pulling verified $service image ($2)..."
docker pull "$new_image" >/dev/null
set_pin "$new_image"

if ! (compose config --quiet && compose up -d --no-deps "$service"); then
  set_pin "$old_image"
  echo "Failed to start $service; restored prior pin." >&2
  exit 1
fi

healthy=0
for i in $(seq 1 45); do
  if curl -fsS --max-time 3 -o /dev/null "http://127.0.0.1:$port/api/health"; then
    healthy=1
    break
  fi
  sleep 2
done
actual_image="$(docker inspect --format '{{.Config.Image}}' "ai-wonderland-hostbrr-$service-1" 2>/dev/null || true)"
if [[ "$healthy" != 1 || "$actual_image" != "$new_image" ]]; then
  echo "New $service failed health or image verification; rolling back..." >&2
  set_pin "$old_image"
  if docker image inspect "$old_image" >/dev/null 2>&1; then
    compose up -d --no-deps "$service" || true
  else
    compose stop "$service" || true
  fi
  exit 1
fi

echo "SUCCESS: $service is healthy on localhost:$port, image SHA $2"
echo 'Caddy and DreamMakerHub website were not modified.'
