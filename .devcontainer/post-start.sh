#!/bin/bash

# Post-start script - runs every time the container starts
echo "🚀 Starting Wonderland Workspace..."

# Check if there's a repository to clone
if [ -n "$REPO_URL" ] && [ ! -d "/workspaces/.git" ]; then
    echo "📦 Checking for repository..."
    # Repository cloning is handled by envbuilder or Coder
fi

# Start any background services if needed
if [ -f "/workspaces/docker-compose.yml" ]; then
    echo "🐳 Found docker-compose.yml - services will start when needed"
fi

# Display status
echo ""
echo "Workspace Status:"
echo "  💻 IDE: http://localhost:8080"
echo "  📁 Workspace: /workspaces"
echo "  👤 User: $(whoami)"
echo ""
echo "✨ Workspace is ready!"
