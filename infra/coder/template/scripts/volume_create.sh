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

VOL_ID=""
for ATTEMPT in 1 2 3 4 5 6 7 8 9 10; do
  RESP=$(gql "mutation { volumeCreate(input: { projectId: \\\"$PROJECT_ID\\\", serviceId: \\\"$SERVICE_ID\\\", mountPath: \\\"/home/coder\\\" }) { id } }" || echo '')
  echo "$RESP"
  VOL_ID=$(echo "$RESP" | sed -n 's/.*"volumeCreate":{"id":"\([^"]*\)".*/\1/p' | head -1)
  [ -n "$VOL_ID" ] && break

  # "Service not found" can occur for a few seconds after serviceCreate even
  # after the service id is returned. Refresh the authoritative service id
  # from the project before retrying the volume mutation.
  SE=$(lookup_service_and_env "$PROJECT_ID")
  REFRESHED_SERVICE_ID=$(echo "$SE" | awk '{print $1}')
  if [ -n "$REFRESHED_SERVICE_ID" ]; then
    SERVICE_ID="$REFRESHED_SERVICE_ID"
    echo "$SERVICE_ID" > "$STATE_DIR/service_id"
  fi

  echo "volumeCreate attempt $ATTEMPT failed; retrying..."
  [ "$ATTEMPT" -lt 10 ] && sleep 3
done

if [ -z "$VOL_ID" ]; then
  echo "FATAL: volumeCreate failed after 10 attempts"
  exit 1
fi

mkdir -p "$STATE_DIR"
echo "$VOL_ID" > "$STATE_DIR/volume_id"
