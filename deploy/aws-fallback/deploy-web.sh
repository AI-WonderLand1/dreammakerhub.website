#!/usr/bin/env bash
# Runs on a pre-provisioned AWS Linux VM. The GitHub Actions workflow supplies
# an immutable GHCR image SHA and a short-lived, read-only package token via stdin.
set -Eeuo pipefail
umask 077

image_sha="${1:?Usage: deploy-web.sh IMAGE_SHA GITHUB_ACTOR}"
registry_user="${2:?Usage: deploy-web.sh IMAGE_SHA GITHUB_ACTOR}"
[[ "$image_sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'Image SHA must be 40 lowercase hex characters.' >&2; exit 1; }
[[ "$registry_user" =~ ^[a-zA-Z0-9-]+$ ]] || { echo 'Invalid registry username.' >&2; exit 1; }

app_dir="$HOME/dreammakerhub-fallback"
env_file="$app_dir/runtime.env"
image="ghcr.io/ai-wonderland1/dreammakerhub-website:$image_sha"
container='dreammaker-web-fallback'
previous="${container}-previous"

[[ -s "$env_file" ]] || { echo 'Missing fallback runtime.env.' >&2; exit 1; }
command -v docker >/dev/null || { echo 'Install Docker first.' >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo 'The SSH user needs Docker access.' >&2; exit 1; }
if docker container inspect "$previous" >/dev/null 2>&1; then
  echo "Previous rollback container $previous exists; inspect it before retrying." >&2
  exit 1
fi

# A temporary Docker credential store avoids persisting the GitHub Actions token
# on the VM. Never print the token or write it to a checked-in file.
docker_config="$(mktemp -d)"
export DOCKER_CONFIG="$docker_config"
trap 'rm -rf -- "$docker_config"' EXIT
docker login ghcr.io --username "$registry_user" --password-stdin >/dev/null
docker pull "$image" >/dev/null

had_previous=0
if docker container inspect "$container" >/dev/null 2>&1; then
  docker stop "$container" >/dev/null
  docker rename "$container" "$previous"
  had_previous=1
fi

restore_previous() {
  docker rm -f "$container" >/dev/null 2>&1 || true
  if [[ "$had_previous" == 1 ]]; then
    docker rename "$previous" "$container"
    docker start "$container" >/dev/null
    echo 'Restored the previous AWS fallback container.' >&2
  fi
}

if ! docker run -d \
    --name "$container" \
    --restart unless-stopped \
    --env-file "$env_file" \
    --env PORT=5000 \
    --env NODE_ENV=production \
    --env NODE_OPTIONS=--max-http-header-size=32768 \
    --publish 127.0.0.1:5001:5000 \
    "$image" >/dev/null; then
  restore_previous
  exit 1
fi

healthy=0
for attempt in $(seq 1 45); do
  if ! [[ "$(docker inspect --format '{{.State.Status}}' "$container" 2>/dev/null || true)" == running ]]; then
    break
  fi
  if docker exec "$container" curl --fail --silent --show-error http://127.0.0.1:5000/health >/dev/null 2>&1; then
    healthy=1
    break
  fi
  sleep 2
done

if [[ "$healthy" != 1 ]]; then
  echo 'AWS fallback failed its internal /health check. No application logs or secrets were printed.' >&2
  restore_previous
  exit 1
fi

# Verify the host-facing, loopback-only port as well.
if ! curl --fail --silent --show-error http://127.0.0.1:5001/health >/dev/null; then
  echo 'AWS fallback is not reachable on the host loopback port.' >&2
  restore_previous
  exit 1
fi

if [[ "$had_previous" == 1 ]]; then
  docker rm -f "$previous" >/dev/null
fi
printf 'AWS fallback web container is healthy on 127.0.0.1:5001 at image %s.\n' "$image_sha"
