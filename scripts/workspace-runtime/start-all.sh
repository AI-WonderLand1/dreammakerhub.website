#!/bin/bash
set -e

PORT_IDE=${PORT_IDE:-3000}
PORT_PLAYCANVAS=${PORT_PLAYCANVAS:-3001}
PORT_WEBGL_STUDIO=${PORT_WEBGL_STUDIO:-3002}

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

start_service() {
    local name=$1
    local port=$2
    local cmd=$3

    log "Starting $name on port $port"
    export PORT=$port
    eval $cmd &
}

log "WonderSpace Runtime Starting"
log "IDE: $PORT_IDE | PlayCanvas: $PORT_PLAYCANVAS | WebGL Studio: $PORT_WEBGL_STUDIO"

start_service "IDE" $PORT_IDE "npm run dev --workspace=ai-wonder-web"
start_service "PlayCanvas" $PORT_PLAYCANVAS "echo 'PlayCanvas service placeholder'"
start_service "WebGL Studio" $PORT_WEBGL_STUDIO "echo 'WebGL Studio service placeholder'"

log "All services started"

wait