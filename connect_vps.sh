#!/usr/bin/env bash
# connect_vps.sh — SSH into the VPS.
#
# Credentials are NEVER hardcoded. Provide them via environment variables:
#   VPS_HOST   Hostname or IP of the server (required)
#   VPS_USER   SSH user (default: root)
#   VPS_KEY    Path to a private key to use (optional; falls back to ssh-agent)
#
# Usage:
#   VPS_HOST=1.2.3.4 VPS_USER=ubuntu VPS_KEY=~/.ssh/id_ed25519 ./connect_vps.sh
set -euo pipefail

: "${VPS_HOST:?Set VPS_HOST to the server hostname/IP}"
VPS_USER="${VPS_USER:-root}"

ssh_opts=()
if [ -n "${VPS_KEY:-}" ]; then
  ssh_opts+=(-i "$VPS_KEY")
fi

exec ssh "${ssh_opts[@]}" "${VPS_USER}@${VPS_HOST}"
