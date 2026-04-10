#!/bin/bash
set -e

echo "🏗️  Wonderland Devcontainer Post-Create Setup"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure we're in the right directory
cd /workspaces || cd ~

echo -e "${BLUE}Setting up environment...${NC}"

# Create helpful aliases
cat >> ~/.zshrc << 'EOF'

# Wonderland Aliases
alias ll='ls -la'
alias ..='cd ..'
alias ...='cd ../..'
alias gs='git status'
alias gp='git pull'
alias gco='git checkout'
alias gcm='git commit -m'
alias gpush='git push'
alias gpf='git push --force-with-lease'
alias serve='python3 -m http.server'

# Development shortcuts
alias dev='npm run dev'
alias build='npm run build'
alias test='npm test'
alias lint='npm run lint'

# Wonderland specific
alias wonder-logs='kubectl logs -f -l app=coder-workspace -n wonderland'
alias wonder-pods='kubectl get pods -n wonderland'
alias wonder-status='kubectl get all -n wonderland'
EOF

echo -e "${GREEN}✓ Aliases configured${NC}"

# Set up git to use the workspace's gitconfig if it exists
if [ -f ".gitconfig" ]; then
    echo -e "${BLUE}Configuring git...${NC}"
    git config --global include.path ~/.gitconfig-workspace
    cp .gitconfig ~/.gitconfig-workspace
    echo -e "${GREEN}✓ Git configuration copied${NC}"
fi

# Install VS Code extensions if code-server is available
if command -v code-server &> /dev/null; then
    echo -e "${BLUE}Installing VS Code extensions...${NC}"
    
    # Core extensions
    code-server --install-extension dbaeumer.vscode-eslint 2>/dev/null || true
    code-server --install-extension esbenp.prettier-vscode 2>/dev/null || true
    code-server --install-extension eamodio.gitlens 2>/dev/null || true
    code-server --install-extension github.copilot 2>/dev/null || true
    
    echo -e "${GREEN}✓ VS Code extensions installed${NC}"
fi

# Display welcome message
cat << 'EOF'

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🌟 Welcome to Wonderland Private IDE! 🌟                  ║
║                                                              ║
║   Your personal cloud development environment is ready.     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Quick Start:
  • Your workspace: /workspaces
  • Start coding: Open files in the explorer
  • Terminal: Ctrl+` or View → Terminal
  • Git: Use the Source Control panel

Need Help?
  • Run 'coder --help' for workspace commands
  • Check the README.md in your repository

Happy Coding! 🚀

EOF

echo -e "${GREEN}✅ Post-create setup complete!${NC}"
