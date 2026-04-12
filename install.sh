#!/bin/bash
#
# WonderSpace IDE - One-Click Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/wonderingtribe/wonderspace/main/install.sh | bash
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================"
echo "  WonderSpace IDE - One-Click Installer"
echo "============================================"
echo -e "${NC}"

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker found${NC}"
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi

# Get user input
echo ""
echo -e "${BLUE}Configuration${NC}"
echo "============================================"

read -p "Enter your domain (e.g., ide.yourdomain.com): " DOMAIN
read -p "Enter your OpenCode API key (get from opencode.ai): " OPENCODE_API_KEY
read -p "Choose deployment mode [local/cloud]: " MODE

if [ "$MODE" = "cloud" ]; then
    ENABLE_TLS="true"
    CODER_ACCESS_URL="https://${DOMAIN}"
else
    ENABLE_TLS="false"
    CODER_ACCESS_URL="http://localhost:7080"
fi

# Create working directory
INSTALL_DIR="${HOME}/wonderspace-ide"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo ""
echo -e "${BLUE}Downloading WonderSpace IDE...${NC}"

# Download docker-compose.yml
curl -fsSL -o docker-compose.yml https://raw.githubusercontent.com/wonderingtribe/wonderspace/main/docker-compose.yml

# Download Caddyfile config
mkdir -p config
curl -fsSL -o config/Caddyfile https://raw.githubusercontent.com/wonderingtribe/wonderspace/main/Docker-image/config/Caddyfile

# Create .env file
cat > .env <<EOF
# WonderSpace IDE Configuration
# Generated on $(date)

# Your domain
DOMAIN=${DOMAIN}
CODER_ACCESS_URL=${CODER_ACCESS_URL}
CODER_WILDCARD_ACCESS_URL=*.ide.${DOMAIN}

# Security (KEEP SECRET)
OPENCODE_API_KEY=${OPENCODE_API_KEY}
WONDERSPACE_API_KEY=ws-live-$(openssl rand -hex 16)

# TLS/HTTPS
ENABLE_TLS=${ENABLE_TLS}

# Ports
CODER_HTTP_ADDRESS=0.0.0.0:7080
BILLING_PORT=8888
EOF

echo -e "${GREEN}✓ Configuration saved to ${INSTALL_DIR}/.env${NC}"

# Pull and run
echo ""
echo -e "${BLUE}Starting WonderSpace IDE...${NC}"
docker-compose up -d

# Wait for services
echo ""
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check health
if curl -sf http://localhost:7080/healthz > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Coder is running${NC}"
else
    echo -e "${YELLOW}⚠ Coder is still starting (may take 1-2 minutes)${NC}"
fi

# Get the WonderSpace API key
WS_API_KEY=$(grep WONDERSPACE_API_KEY .env | cut -d= -f2)

# Show success message
echo ""
echo -e "${GREEN}============================================"
echo "  WonderSpace IDE is Ready!"
echo "============================================${NC}"
echo ""
echo -e "  Dashboard: ${BLUE}${CODER_ACCESS_URL}${NC}"
echo "  Wildcard:  ${BLUE}*.ide.${DOMAIN}${NC}"
echo ""
echo -e "  🔑 ${YELLOW}WONDERSPACE API KEY (give to users):${NC}"
echo -e "     ${GREEN}${WS_API_KEY}${NC}"
echo ""
echo -e "  📁 Installation directory: ${BLUE}${INSTALL_DIR}${NC}"
echo ""

if [ "$MODE" = "cloud" ]; then
    echo -e "  ${YELLOW}Next steps:${NC}"
    echo -e "  1. Point DNS A records to this server IP:"
    echo -e "     ${DOMAIN} → $(curl -s ifconfig.me)"
    echo -e "     *.ide.${DOMAIN} → $(curl -s ifconfig.me)"
    echo -e "  2. Wait 2-3 minutes for SSL certificates"
    echo -e "  3. Visit ${CODER_ACCESS_URL}"
fi

echo ""
echo -e "  ${BLUE}Useful commands:${NC}"
echo -e "  • View logs:    docker-compose logs -f"
echo -e "  • Stop:         docker-compose down"
echo -e "  • Restart:      docker-compose restart"
echo -e "  • Update:       docker-compose pull && docker-compose up -d"
echo ""
echo -e "${GREEN}============================================${NC}"

# Save API key to file for reference
echo "$WS_API_KEY" > "${INSTALL_DIR}/API_KEY.txt"
echo "API key saved to: ${INSTALL_DIR}/API_KEY.txt"