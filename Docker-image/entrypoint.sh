#!/bin/bash
set -e

CODER_ACCESS_URL="${CODER_ACCESS_URL:-http://localhost:7080}"
CODER_WILDCARD_ACCESS_URL="${CODER_WILDCARD_ACCESS_URL:-*.ide.localhost}"
CODER_HTTP_ADDRESS="${CODER_HTTP_ADDRESS:-0.0.0.0:7080}"
PGDATA="${PGDATA:-/var/lib/postgresql/data}"
WORKSPACE_IMAGE="${WORKSPACE_IMAGE:-wonderspace-ide-workspace:latest}"
FALLBACK_IMAGE="${FALLBACK_IMAGE:-codercom/enterprise-base:ubuntu}"

echo "============================================"
echo "  WonderSpace IDE - Coder in a Box"
echo "============================================"
echo ""

# --- Step 1: Load bundled workspace image into Docker ---
echo ">>> Loading workspace image..."
if [ -f /opt/workspace-image.tar ]; then
    if docker load < /opt/workspace-image.tar 2>/dev/null; then
        echo "    Workspace image loaded from bundled tar."
    else
        echo "    WARNING: Failed to load bundled image, pulling fallback from Docker Hub..."
        docker pull "$FALLBACK_IMAGE"
        WORKSPACE_IMAGE="$FALLBACK_IMAGE"
    fi
else
    echo "    No bundled workspace image found, pulling fallback from Docker Hub..."
    docker pull "$FALLBACK_IMAGE"
    WORKSPACE_IMAGE="$FALLBACK_IMAGE"
fi

# --- Step 2: Initialize PostgreSQL ---
echo ">>> Initializing PostgreSQL..."
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    mkdir -p "$PGDATA"
    chown -R postgres:postgres "$PGDATA"
    su - postgres -c "initdb -D $PGDATA"
    su -postgres -c "pg_ctl -D $PGDATA -o '-k /var/run/postgresql' -w start"
    su - postgres -c "createdb coder"
    su - postgres -c "pg_ctl -D $PGDATA -m fast -w stop"
else
    echo "    Database already initialized, skipping."
fi

echo ">>> Starting PostgreSQL..."
mkdir -p /var/run/postgresql
chown -R postgres:postgres /var/run/postgresql
su - postgres -c "pg_ctl -D $PGDATA -o '-k /var/run/postgresql' -w start"

# Wait for PostgreSQL to be ready
echo ">>> Waiting for PostgreSQL..."
for i in $(seq 1 30); do
    if su - postgres -c "pg_isready -q" 2>/dev/null; then
        echo "    PostgreSQL is ready."
        break
    fi
    sleep 1
done

# --- Step 3: Export connection URL ---
export CODER_PG_CONNECTION_URL="postgres://coder@localhost:5432/coder?sslmode=disable"

# --- Step 4: Configure Coder from env vars ---
export CODER_ACCESS_URL
export CODER_WILDCARD_ACCESS_URL
export CODER_HTTP_ADDRESS
export CODER_TELEMETRY_ENABLE="${CODER_TELEMETRY_ENABLE:-false}"
export CODER_UPDATE_CHECK="${CODER_UPDATE_CHECK:-false}"

echo ">>> Coder configuration:"
echo "    Access URL:    $CODER_ACCESS_URL"
echo "    Wildcard URL:  $CODER_WILDCARD_ACCESS_URL"
echo "    HTTP Address:  $CODER_HTTP_ADDRESS"
echo "    Workspace Image: $WORKSPACE_IMAGE"
echo ""

# --- Step 5: Start Coder server ---
echo ">>> Starting Coder server..."
coder server --accessible-url "$CODER_ACCESS_URL" &
CODER_PID=$!

# Wait for Coder to be ready
echo ">>> Waiting for Coder server..."
for i in $(seq 1 60); do
    if curl -sf http://localhost:7080/healthz > /dev/null 2>&1; then
        echo "    Coder server is ready!"
        break
    fi
    sleep 2
done

# --- Step 6: Push workspace templates on first boot ---
FIRST_BOOT_MARKER="/opt/.templates-pushed"
if [ ! -f "$FIRST_BOOT_MARKER" ]; then
    echo ">>> First boot detected. Pushing workspace templates..."

    FIRST_USER_TOKEN=$(coder login show-token 2>/dev/null || "")

    for template_dir in /opt/templates/*/; do
        template_name=$(basename "$template_dir")
        if [ -d "$template_dir" ]; then
            echo "    Pushing template: $template_name"
            if [ -n "$FIRST_USER_TOKEN" ]; then
                coder templates push -d "$template_dir" "$template_name" 2>/dev/null || \
                    echo "    Note: You can push templates later via the Coder dashboard."
            else
                echo "    Note: Login to Coder dashboard first, then push templates manually."
            fi
        fi
    done

    touch "$FIRST_BOOT_MARKER"
    echo ">>> Templates processed."
fi

echo ""
echo "============================================"
echo "  WonderSpace IDE is running!"
echo "============================================"
echo ""
echo "  Dashboard:   $CODER_ACCESS_URL"
echo "  Workspace image: $WORKSPACE_IMAGE"
echo ""
echo "  1. Open the dashboard URL above in your browser"
echo "  2. Create your admin account"
echo "  3. Users each get an isolated IDE workspace"
echo ""
echo "  To create a workspace from CLI:"
echo "    coder login $CODER_ACCESS_URL"
echo "    coder create my-workspace -t docker"
echo ""
echo "============================================"

wait $CODER_PID