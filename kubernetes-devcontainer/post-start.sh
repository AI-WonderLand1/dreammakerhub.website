#!/bin/bash
set -e

echo "🚀 Wonderland Workspace Auto-Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get workspace info
WORKSPACE_NAME="${WORKSPACE_NAME:-workspace}"
USER_ID="${USER_ID:-user}"
PROJECT_ID="${PROJECT_ID:-}"
REPO_URL="${REPO_URL:-}"

echo -e "${GREEN}Workspace:${NC} $WORKSPACE_NAME"
echo -e "${GREEN}User:${NC} $USER_ID"

# Change to workspaces directory
cd /home/coder/project

# Clone repository if provided and directory is empty
if [ -n "$REPO_URL" ] && [ -z "$(ls -A)" ]; then
    echo -e "${YELLOW}📦 Cloning repository...${NC}"
    git clone "$REPO_URL" .
    echo -e "${GREEN}✓ Repository cloned${NC}"
fi

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
    
    # Detect package manager
    if [ -f "pnpm-lock.yaml" ]; then
        echo "Using pnpm..."
        pnpm install
    elif [ -f "yarn.lock" ]; then
        echo "Using yarn..."
        yarn install
    elif [ -f "bun.lockb" ]; then
        echo "Using bun..."
        bun install
    else
        echo "Using npm..."
        npm install
    fi
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

# Install Python dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}🐍 Installing Python dependencies...${NC}"
    pip3 install -r requirements.txt
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
fi

# Set up Git hooks if .git exists
if [ -d ".git" ]; then
    echo -e "${YELLOW}🔧 Setting up Git configuration...${NC}"
    
    # Configure git to use the workspace's .gitconfig if it exists
    if [ -f ".gitconfig" ]; then
        git config --local include.path ../.gitconfig
    fi
    
    # Set up pre-commit hooks if pre-commit is available
    if command -v pre-commit &> /dev/null && [ -f ".pre-commit-config.yaml" ]; then
        pre-commit install
        echo -e "${GREEN}✓ Pre-commit hooks installed${NC}"
    fi
fi

# Create .env file from example if it doesn't exist
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please review and update .env with your values${NC}"
fi

# Start development server if in auto-start mode
if [ "${AUTO_START:-false}" = "true" ]; then
    echo -e "${YELLOW}🌐 Auto-starting development server...${NC}"
    
    if [ -f "package.json" ]; then
        # Check for dev script
        if grep -q '"dev"' package.json; then
            echo "Starting dev server..."
            nohup sh -c 'npm run dev > /tmp/dev-server.log 2>&1 &' 
            echo -e "${GREEN}✓ Dev server started (logs: /tmp/dev-server.log)${NC}"
        elif grep -q '"start"' package.json; then
            echo "Starting app..."
            nohup sh -c 'npm start > /tmp/app-server.log 2>&1 &' 
            echo -e "${GREEN}✓ App started (logs: /tmp/app-server.log)${NC}"
        fi
    fi
fi

# Run custom setup script if provided
if [ -f ".devcontainer/setup.sh" ]; then
    echo -e "${YELLOW}🔧 Running custom setup script...${NC}"
    bash .devcontainer/setup.sh
    echo -e "${GREEN}✓ Custom setup complete${NC}"
fi

# Display helpful information
echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}✨ Workspace is ready!${NC}"
echo ""
echo "Quick Commands:"
echo "  code-server --help     # Show code-server help"
echo "  coder --help           # Show Coder CLI help"
echo ""
echo "Workspace Info:"
echo "  Home: /workspaces"
echo "  User: $(whoami)"
echo "  Node: $(node --version 2>/dev/null || echo 'Not installed')"
echo "  Python: $(python3 --version 2>/dev/null || echo 'Not installed')"
echo ""
echo -e "${GREEN}====================================${NC}"
