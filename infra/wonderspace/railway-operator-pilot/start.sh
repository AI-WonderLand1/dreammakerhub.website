#!/usr/bin/env bash
set -Eeuo pipefail

# Railway's public domain is not an authentication boundary. Never start
# a terminal-equipped IDE without its own operator-only login credential.
if [[ -z "${PASSWORD:-}" && -z "${HASHED_PASSWORD:-}" ]]; then
  echo "Set a unique PASSWORD or HASHED_PASSWORD as a private Railway variable." >&2
  exit 1
fi
PORT="${PORT:-8080}"
if [[ ! "$PORT" =~ ^[0-9]+$ ]] || (( PORT < 1 || PORT > 65535 )); then
  echo "Invalid PORT." >&2
  exit 1
fi
umask 077
# Railway volumes mount as root. The container starts as root only to
# prepare this dedicated volume, then drops to the unprivileged coder user.
mkdir -p /home/coder
chown coder:coder /home/coder
install -d -o coder -g coder -m 0700 \
  /home/coder/project \
  /home/coder/.config \
  /home/coder/.local \
  /home/coder/.local/share \
  /home/coder/.local/share/code-server
exec runuser -u coder -- /usr/bin/code-server \
  --bind-addr "0.0.0.0:${PORT}" \
  --auth password \
  --disable-telemetry \
  --disable-update-check \
  /home/coder/project
