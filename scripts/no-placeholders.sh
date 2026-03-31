#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Patterns that should never remain in committed code.
BLOCK_PATTERN="(__PLACEHOLDER__|REPLACE_ME|TBD_REPLACE|ADD_API_KEY_HERE|YOUR_VALUE_HERE)"

matches=$(rg --files-with-matches --hidden \
  --glob '!.git' \
  --glob '!node_modules' \
  --glob '!.next' \
  --glob '!.turbo' \
  --glob '!scripts/no-placeholders.sh' \
  --glob '!coverage' \
  --glob '!.vercel' \
  --glob '!dist' \
  "$BLOCK_PATTERN" || true)

if [[ -n "$matches" ]]; then
  echo "Placeholder markers detected. Please replace them before building:"
  echo "$matches"
  exit 1
fi

echo "No placeholder markers detected."
