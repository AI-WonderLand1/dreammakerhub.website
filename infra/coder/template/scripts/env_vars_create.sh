#!/usr/bin/env bash
# Upsert required Coder agent env vars on the Railway workspace service.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

PROJECT_ID=""
SERVICE_ID=""
ENV_ID=""

if ! resolve_workspace_ids; then
  echo "FATAL: service/env not found after waiting for Railway propagation"
  exit 1
fi

upsert_var() {
  local name="$1" value="$2"
  local attempt resp
  for attempt in 1 2 3 4 5; do
    resp=$(curl -s --max-time 60 -X POST "$API" \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{\"query\": \"mutation { variableUpsert(input: { projectId: \\\"$PROJECT_ID\\\", serviceId: \\\"$SERVICE_ID\\\", environmentId: \\\"$ENV_ID\\\", name: \\\"$name\\\", value: \\\"$value\\\", skipDeploys: true }) }\"}" || true)
    if echo "$resp" | grep -q '"variableUpsert":true'; then
      return 0
    fi
    echo "variableUpsert $name attempt $attempt failed (resp: ${resp:0:200}), retrying..." >&2
    [ "$attempt" -lt 5 ] && sleep 5
  done
  echo "FATAL: variableUpsert $name failed after 5 attempts" >&2
  exit 1
}

upsert_var "CODER_INIT_SCRIPT_B64" "$CODER_INIT_SCRIPT_B64"
upsert_var "CODER_AGENT_TOKEN" "$CODER_AGENT_TOKEN"
upsert_var "RAILWAY_RUN_UID" "0"
