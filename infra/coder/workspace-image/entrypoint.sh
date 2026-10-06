#!/usr/bin/env bash
set -euo pipefail

HOME_DIR=/home/coder

# Fresh Docker volumes can be root-owned on first mount. Fix ownership before
# switching to the unprivileged coder user.
if [ "$(id -u)" = "0" ]; then
  chown coder:coder "$HOME_DIR" 2>/dev/null || true
fi

# Seed shell defaults only once. The whole home directory is persistent.
if [ ! -f "$HOME_DIR/.init_done" ]; then
  cp -rT /etc/skel "$HOME_DIR" 2>/dev/null || true
  touch "$HOME_DIR/.init_done"
fi

mkdir -p \
  "$HOME_DIR/projects" \
  "$HOME_DIR/.filebrowser" \
  "$HOME_DIR/.local/bin" \
  "$HOME_DIR/.local/lib" \
  "$HOME_DIR/.cache/pip" \
  "$HOME_DIR/.npm-global" \
  "$HOME_DIR/.npm-cache" \
  "$HOME_DIR/.local/share/pnpm" \
  "$HOME_DIR/.cache/pnpm" \
  "$HOME_DIR/.cache/yarn" \
  "$HOME_DIR/.cache/bun"

if [ "$(id -u)" = "0" ]; then
  chown -R coder:coder "$HOME_DIR" 2>/dev/null || true
fi

# The Coder init script is passed base64-encoded to avoid shell escaping
# issues. It starts the Coder agent and the apps/modules attached to it.
if [ -z "${CODER_INIT_SCRIPT_B64:-}" ]; then
  echo "ERROR: CODER_INIT_SCRIPT_B64 is not set."
  echo "This image is intended to run as an AI WONDERLAND Coder workspace."
  sleep infinity
fi

INIT_SCRIPT_FILE="$(mktemp /tmp/coder-init.XXXXXX)"
printf '%s' "$CODER_INIT_SCRIPT_B64" | base64 -d > "$INIT_SCRIPT_FILE"
chmod 0755 "$INIT_SCRIPT_FILE"

if [ "$(id -u)" = "0" ]; then
  chown coder:coder "$INIT_SCRIPT_FILE"
  exec su -s /bin/bash coder "$INIT_SCRIPT_FILE"
fi

exec "$INIT_SCRIPT_FILE"
