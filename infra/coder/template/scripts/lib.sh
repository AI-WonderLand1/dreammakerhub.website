# Common helpers for the Railway GraphQL provisioner scripts.
# Source this file with: . "$(dirname "$0")/lib.sh"
#
# Required env vars set by the caller (TF environment {} block):
#   API   - Railway GraphQL endpoint
#   TOKEN - Railway API token (Bearer)
# Optional:
#   PROJECT_NAME - Railway project name (used by lookup helpers)
#   STATE_DIR    - Local state directory holding *_id files

gql() {
  local query="$1"
  local tmpjson
  tmpjson=$(mktemp)
  printf '{"query": "%s"}' "$query" > "$tmpjson"
  curl -s --max-time 120 -X POST "$API" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d @"$tmpjson"
  local rc=$?
  rm -f "$tmpjson"
  return $rc
}

# Lookup project id only. Prints the id, empty on miss. Always returns 0.
lookup_project_id() {
  local resp
  resp=$(gql '{ projects { edges { node { id name } } } }' || echo '')
  echo "$resp" | grep -o '"id":"[^"]*","name":"'"$PROJECT_NAME"'"' \
    | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1 || true
}

# Lookup project id and its production environment id. Query the selected
# project separately so an environment from another project can never be
# mistaken for this workspace.
lookup_project_and_env() {
  local pid resp env_id
  pid=$(lookup_project_id)
  [ -z "$pid" ] && return 0
  resp=$(gql "{ project(id: \\\"$pid\\\") { environments { edges { node { id name } } } } }" || echo '')
  env_id=$(echo "$resp" | grep -o '"id":"[^"]*","name":"production"' \
    | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1 || true)
  printf '%s %s\n' "$pid" "$env_id"
}

# Lookup service id and production environment id inside a project.
lookup_service_and_env() {
  local pid="$1"
  local resp svc_id env_id
  resp=$(gql "{ project(id: \\\"$pid\\\") { services { edges { node { id name } } } environments { edges { node { id name } } } } }" || echo '')
  svc_id=$(echo "$resp" | grep -o '"id":"[^"]*","name":"workspace"' \
    | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1 || true)
  env_id=$(echo "$resp" | grep -o '"id":"[^"]*","name":"production"' \
    | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1 || true)
  printf '%s %s\n' "$svc_id" "$env_id"
}

# Resolve project/service/environment IDs with retries for Railway's eventual
# consistency after projectCreate/serviceCreate. Persists recovered IDs so all
# later provisioners use the exact same resources.
resolve_workspace_ids() {
  local attempt se
  load_state

  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if [ -z "$PROJECT_ID" ]; then
      PROJECT_ID=$(lookup_project_id)
    fi
    if [ -n "$PROJECT_ID" ] && { [ -z "$SERVICE_ID" ] || [ -z "$ENV_ID" ]; }; then
      se=$(lookup_service_and_env "$PROJECT_ID")
      [ -z "$SERVICE_ID" ] && SERVICE_ID=$(echo "$se" | awk '{print $1}')
      [ -z "$ENV_ID" ] && ENV_ID=$(echo "$se" | awk '{print $2}')
    fi

    if [ -n "$PROJECT_ID" ] && [ -n "$SERVICE_ID" ] && [ -n "$ENV_ID" ]; then
      if [ -n "${STATE_DIR:-}" ]; then
        mkdir -p "$STATE_DIR"
        printf '%s\n' "$PROJECT_ID" > "$STATE_DIR/project_id"
        printf '%s\n' "$SERVICE_ID" > "$STATE_DIR/service_id"
        printf '%s\n' "$ENV_ID" > "$STATE_DIR/environment_id"
      fi
      return 0
    fi

    [ "$attempt" -lt 10 ] && sleep 2
  done

  return 1
}

load_state() {
  [ -n "${STATE_DIR:-}" ] || return 0
  [ -f "$STATE_DIR/project_id" ] && PROJECT_ID=$(cat "$STATE_DIR/project_id")
  [ -f "$STATE_DIR/service_id" ] && SERVICE_ID=$(cat "$STATE_DIR/service_id")
  [ -f "$STATE_DIR/environment_id" ] && ENV_ID=$(cat "$STATE_DIR/environment_id")
  return 0
}
