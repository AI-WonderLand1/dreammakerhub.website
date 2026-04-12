#!/bin/bash
set -e

echo "============================================"
echo "  WonderSpace IDE - Local Deployment"
echo "============================================"
echo ""
echo "  This runs WonderSpace IDE locally for testing."
echo "  No HTTPS/TLS — use for development only."
echo ""

IMAGE="${IMAGE:-wonderspace-ide:latest}"

docker run -d \
    --name wonderspace \
    -p 7080:7080 \
    -v wonderspace-db:/var/lib/postgresql/data \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e CODER_ACCESS_URL=http://localhost:7080 \
    --restart unless-stopped \
    "$IMAGE"

echo ""
echo "  WonderSpace IDE starting..."
echo "  Open http://localhost:7080 in your browser"
echo ""
echo "  To stop:  docker stop wonderspace"
echo "  To remove: docker rm -f wonderspace"
echo ""