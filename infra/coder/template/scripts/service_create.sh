#!/usr/bin/env bash
# Create (or look up) the "workspace" service inside the Railway project.
# Idempotent. Writes service_id and environment_id to $STATE_DIR.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

mkdir -p "$STATE_DIR"

PROJECT_ID=""
SERVICE_ID=""
ENV_ID=""
load_state

if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(lookup_project_id)
fi
[ -z "$PROJECT_ID" ] && {
  echo "FATAL: project not found"
  exit 1
}

# Reuse an existing service if a previous attempt created it.
SE=$(lookup_service_and_env "$PROJECT_ID")
EXISTING_SVC=$(echo "$SE" | awk '{print $1}')
ENV_ID=$(echo "$SE" | awk '{print $2}')
if [ -n "$EXISTING_SVC" ]; then
  echo "Service already exists: $EXISTING_SVC"
  echo "$EXISTING_SVC" > "$STATE_DIR/service_id"
  [ -n "$ENV_ID" ] && echo "$ENV_ID" > "$STATE_DIR/environment_id"
  exit 0
fi

# Railway can be eventually consistent immediately after project creation.
# Only accept serviceCreate as success when an actual id is returned.
for ATTEMPT in 1 2 3 4 5 6 7 8 9 10; do
  RESP=$(gql "mutation { serviceCreate(input: { name: \\\"workspace\\\", projectId: \\\"$PROJECT_ID\\\" }) { id } }" || echo '')
  echo "$RESP"

  CANDIDATE_ID=$(echo "$RESP" | sed -n 's/.*"serviceCreate":{"id":"\([^"]*\)".*/\1/p' | head -1)

  # Do not trust the mutation response alone. Railway can return an id before
  # the service is queryable by project/volume APIs. Confirm that the service
  # is visible inside this project before persisting it.
  for VERIFY in 1 2 3 4 5; do
    SE=$(lookup_service_and_env "$PROJECT_ID")
    SERVICE_ID=$(echo "$SE" | awk '{print $1}')
    ENV_ID=$(echo "$SE" | awk '{print $2}')
    if [ -n "$SERVICE_ID" ]; then
      echo "Confirmed workspace service: $SERVICE_ID"
      break 2
    fi
    [ "$VERIFY" -lt 5 ] && sleep 2
  done

  if [ -n "$CANDIDATE_ID" ]; then
    echo "serviceCreate returned $CANDIDATE_ID but Railway has not exposed it yet; retrying..."
  fi

  echo "serviceCreate attempt $ATTEMPT failed; retrying..."
  [ "$ATTEMPT" -lt 10 ] && sleep 3
done

[ -z "$SERVICE_ID" ] && {
  echo "FATAL: serviceCreate failed after 10 attempts"
  exit 1
}

echo "$SERVICE_ID" > "$STATE_DIR/service_id"

# Resolve and persist the production environment before downstream volume/env
# resources run. This prevents env_vars_create from failing with
# "service/env not found" during Railway propagation delays.
if [ -z "$ENV_ID" ]; then
  for ATTEMPT in 1 2 3 4 5 6 7 8 9 10; do
    SE=$(lookup_service_and_env "$PROJECT_ID")
    ENV_ID=$(echo "$SE" | awk '{print $2}')
    [ -n "$ENV_ID" ] && break
    [ "$ATTEMPT" -lt 10 ] && sleep 2
  done
fi

[ -z "$ENV_ID" ] && {
  echo "FATAL: production environment not found"
  exit 1
}
echo "$ENV_ID" > "$STATE_DIR/environment_id"
