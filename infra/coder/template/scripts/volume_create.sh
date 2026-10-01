#!/usr/bin/env bash
# Create the persistent volume for the workspace before any deployment.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

PROJECT_ID=""
SERVICE_ID=""
ENV_ID=""

if ! resolve_workspace_ids; then
  echo "FATAL: service/env not found after waiting for Railway propagation"
  exit 1
fi

VOLUMES=$(gql "{ project(id: \\\"$PROJECT_ID\\\") { volumes { edges { node { id name } } } } }")
EXISTING_VOL=$(echo "$VOLUMES" | grep -o '"id":"[^"]*","name":"workspace-volume"' \
  | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1 || true)
if [ -n "$EXISTING_VOL" ]; then
  echo "Volume already exists: $EXISTING_VOL"
  exit 0
fi

RESP=$(gql "mutation { volumeCreate(input: { projectId: \\\"$PROJECT_ID\\\", serviceId: \\\"$SERVICE_ID\\\", environmentId: \\\"$ENV_ID\\\", mountPath: \\\"/home/coder\\\" }) { id } }")
echo "$RESP"
VOL_ID=$(echo "$RESP" | sed -n 's/.*"volumeCreate":{"id":"\([^"]*\)".*/\1/p' | head -1)
if [ -z "$VOL_ID" ]; then
  echo "FATAL: volumeCreate failed"
  exit 1
fi

mkdir -p "$STATE_DIR"
echo "$VOL_ID" > "$STATE_DIR/volume_id"
