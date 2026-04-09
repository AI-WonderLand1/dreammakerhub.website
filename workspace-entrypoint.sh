#!/bin/bash
set -e

WORKSPACE_DIR="${WS_DIR:-/home/coder/project}"
WORKSPACE_NAME="${WORKSPACE_NAME:-my-workspace}"

mkdir -p "${WORKSPACE_DIR}"

if [ ! -f "${WORKSPACE_DIR}/.workspace-ready" ]; then
    cat > "${WORKSPACE_DIR}/README.md" <<'README'
# WonderSpace Workspace

Your isolated cloud development environment.

## What's included
- **code-server** — Full VS Code in the browser
- **PlayCanvas** — 3D game engine (via built-in HTTP server)
- **WebGL Studio** — Shader & graphics editor

## Getting started
1. Open the terminal below
2. Run `pcserve` to start PlayCanvas on port 3001
3. Run `webgls` to start WebGL Studio on port 3002
4. Your files are in this directory
README

    echo "#!/bin/bash" > "${WORKSPACE_DIR}/start-playcanvas.sh"
    echo "cd /home/coder/project && npx serve -l 3001 -s" >> "${WORKSPACE_DIR}/start-playcanvas.sh"
    chmod +x "${WORKSPACE_DIR}/start-playcanvas.sh"

    echo "#!/bin/bash" > "${WORKSPACE_DIR}/start-webglstudio.sh"
    echo "cd /home/coder/project/.webglstudio && npx serve -l 3002 -s" >> "${WORKSPACE_DIR}/start-webglstudio.sh"
    chmod +x "${WORKSPACE_DIR}/start-webglstudio.sh"

    touch "${WORKSPACE_DIR}/.workspace-ready"
fi

echo "WonderSpace: Starting workspace '${WORKSPACE_NAME}'..."
echo "  IDE:        http://localhost:8080"
echo "  PlayCanvas: http://localhost:3001"
echo "  WebGL Studio: http://localhost:3002"
echo ""
echo "Workspace directory: ${WORKSPACE_DIR}"

exec dumb-init /usr/bin/code-server --disable-telemetry --auth none --bind-addr 0.0.0.0:8080 "${WORKSPACE_DIR}"