#!/bin/bash
set -e

CODER_ACCESS_URL="${CODER_ACCESS_URL:-http://localhost:7080}"
CODER_WILDCARD_ACCESS_URL="${CODER_WILDCARD_ACCESS_URL:-}"
CODER_HTTP_ADDRESS="${CODER_HTTP_ADDRESS:-0.0.0.0:7080}"
PGDATA="${PGDATA:-/var/lib/postgresql/data}"
WORKSPACE_IMAGE="${WORKSPACE_IMAGE:-wonderspace-ide-workspace:latest}"
FALLBACK_IMAGE="${FALLBACK_IMAGE:-codercom/enterprise-base:ubuntu}"
ENABLE_TLS="${ENABLE_TLS:-false}"
DOMAIN="${DOMAIN:-}"
OPENCODE_API_KEY="${OPENCODE_API_KEY:-}"

USE_CADDY=false
if [ "$ENABLE_TLS" = "true" ] && [ -n "$DOMAIN" ]; then
    USE_CADDY=true
fi

echo "============================================"
echo "  WonderSpace IDE - Coder in a Box"
echo "============================================"
echo ""

# Check for OpenCode API key (YOUR key - hidden from users)
if [ -z "$OPENCODE_API_KEY" ]; then
    echo "⚠️  WARNING: OPENCODE_API_KEY not set"
    echo "    This is YOUR OpenCode API key (kept secret from users)"
    echo "    Get it from: https://opencode.ai"
    echo "    Set it with: -e OPENCODE_API_KEY=your_key"
    echo ""
fi

# Generate WonderSpace API key (what you give to users - your branded key)
if [ -z "$WONDERSPACE_API_KEY" ]; then
    WONDERSPACE_API_KEY="ws-live-$(openssl rand -hex 16 2>/dev/null || date +%s%N | sha256sum | head -c 32)"
fi
export WONDERSPACE_API_KEY

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
    su - postgres -c "pg_ctl -D $PGDATA -o '-k /var/run/postgresql' -w start"
    su - postgres -c "createdb coder"
    su - postgres -c "pg_ctl -D $PGDATA -m fast -w stop"
else
    echo "    Database already initialized, skipping."
fi

echo ">>> Starting PostgreSQL..."
mkdir -p /var/run/postgresql
chown -R postgres:postgres /var/run/postgresql
su - postgres -c "pg_ctl -D $PGDATA -o '-k /var/run/postgresql' -w start"

echo ">>> Waiting for PostgreSQL..."
for i in $(seq 1 30); do
    if su - postgres -c "pg_isready -q" 2>/dev/null; then
        echo "    PostgreSQL is ready."
        break
    fi
    sleep 1
done

# --- Step 3: Initialize billing schema ---
echo ">>> Initializing billing database..."
su - postgres -c "psql coder -f /opt/billing/schema.sql" 2>/dev/null || echo "    Billing schema already exists."

# --- Step 4: Export connection URL ---
export CODER_PG_CONNECTION_URL="postgres://coder@localhost:5432/coder?sslmode=disable"

# --- Step 5: Configure Coder ---
export CODER_HTTP_ADDRESS
export CODER_TELEMETRY_ENABLE="${CODER_TELEMETRY_ENABLE:-false}"
export CODER_UPDATE_CHECK="${CODER_UPDATE_CHECK:-false}"

if [ "$USE_CADDY" = true ]; then
    # Cloud mode: Caddy handles HTTPS on port 443, proxies to Coder on 7080
    export CODER_HTTP_ADDRESS="0.0.0.0:7080"
    if [ -z "$CODER_ACCESS_URL" ] || [ "$CODER_ACCESS_URL" = "http://localhost:7080" ]; then
        export CODER_ACCESS_URL="https://${DOMAIN}"
    fi
    export CODER_WILDCARD_ACCESS_URL="${CODER_WILDCARD_ACCESS_URL:-*.ide.${DOMAIN}}"
else
    # Local mode: Coder serves HTTP directly
    export CODER_HTTP_ADDRESS="${CODER_HTTP_ADDRESS:-0.0.0.0:7080}"
    export CODER_ACCESS_URL="${CODER_ACCESS_URL:-http://localhost:7080}"
    export CODER_WILDCARD_ACCESS_URL="${CODER_WILDCARD_ACCESS_URL:-}"
fi

# --- Step 6: Start Caddy (TLS mode only) ---
if [ "$USE_CADDY" = true ]; then
    echo ">>> Configuring Caddy for HTTPS..."
    cat > /etc/caddy/Caddyfile <<EOF
${DOMAIN} {
    reverse_proxy localhost:7080
}

*.ide.${DOMAIN} {
    reverse_proxy localhost:7080
}
EOF
    echo ">>> Starting Caddy..."
    caddy start --config /etc/caddy/Caddyfile 2>/dev/null || \
        caddy run --config /etc/caddy/Caddyfile &
    echo "    Caddy is handling HTTPS for ${DOMAIN}"
    echo "    Certificates will be auto-provisioned via Let's Encrypt"
fi

# --- Step 7: Start Billing Gateway (monetization) ---
if [ -n "$OPENCODE_API_KEY" ]; then
    echo ">>> Starting Billing Gateway..."
    export BILLING_PORT=8888
    export OPENCODE_API_KEY
    export CODER_ACCESS_URL
    cd /opt/billing && node gateway.js &
    BILLING_PID=$!
    echo "    Billing Gateway running on port 8888"
    echo "    AI monetization active - you make money on every request!"
fi

# --- Step 8: Start Coder server ---
echo ">>> Starting Coder server..."
coder server &
CODER_PID=$!

echo ">>> Waiting for Coder server..."
for i in $(seq 1 60); do
    if curl -sf http://localhost:7080/healthz > /dev/null 2>&1; then
        echo "    Coder server is ready!"
        break
    fi
    sleep 2
done

# --- Step 9: Push workspace templates on first boot ---
FIRST_BOOT_MARKER="/opt/.templates-pushed"
if [ ! -f "$FIRST_BOOT_MARKER" ]; then
    echo ">>> First boot detected. Pushing workspace templates..."
    for template_dir in /opt/templates/*/; do
        template_name=$(basename "$template_dir")
        if [ -d "$template_dir" ]; then
            echo "    Pushing template: $template_name"
            coder templates push -d "$template_dir" "$template_name" 2>/dev/null || \
                echo "    Note: Create your admin account first, then push templates via CLI or dashboard."
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
if [ "$USE_CADDY" = true ]; then
    echo "  HTTPS:       https://${DOMAIN}"
    echo "  Wildcard:    *.ide.${DOMAIN}"
    echo "  Direct:      http://localhost:7080"
else
    echo "  Dashboard:   $CODER_ACCESS_URL"
fi
echo "  Workspace image: $WORKSPACE_IMAGE"
if [ -n "$OPENCODE_API_KEY" ]; then
    echo "  Billing API: http://localhost:8888"
    echo "  💰 Monetization: ACTIVE"
    echo ""
    echo "  🔑 WONDERSPACE API KEY (give this to your users):"
    echo "     $WONDERSPACE_API_KEY"
    echo ""
    echo "  🔒 OPENCODE_API_KEY (hidden - only you have this)"
fi
echo ""
echo "  1. Open the dashboard URL above in your browser"
echo "  2. Create your admin account"
echo "  3. Users each get an isolated IDE workspace"
echo ""
echo "  CLI:"
echo "    coder login $CODER_ACCESS_URL"
echo "    coder create my-workspace -t docker"
echo ""
if [ "$USE_CADDY" = true ]; then
    echo "  TLS: Automatic via Let's Encrypt / Caddy"
    echo "  Make sure DNS points ${DOMAIN} and *.ide.${DOMAIN} to this server"
fi
if [ -n "$OPENCODE_API_KEY" ]; then
    echo ""
    echo "  💰 MONETIZATION:"
    echo "    - Free tier: 100 requests/month"
    echo "    - Pro: $19/month or $0.08/task"
    echo "    - Enterprise: $49/month or $0.15/run"
    echo "    - Your cost: ~60% less = PROFIT!"
fi
echo "============================================"

wait $CODER_PID