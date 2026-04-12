#!/bin/bash
set -e

echo "============================================"
echo "  WonderSpace IDE - DigitalOcean Deployment"
echo "============================================"
echo ""
echo "  Prerequisites:"
echo "    - doctl CLI installed and authenticated"
echo "    - An SSH key added to DigitalOcean"
echo "    - A domain with DNS pointing to the droplet"
echo ""

DOMAIN="${1:?Usage: $0 ide.yourdomain.com}"
SIZE="${SIZE:-s-2vcpu-4gb}"
REGION="${DO_REGION:-nyc1}"
IMAGE="${DO_IMAGE:-ubuntu-22-04-x64}"
DROPLET_NAME="wonderspace-${DOMAIN//./-}"
SSH_KEY="${DO_SSH_KEY:-}"

CREATE_CMD="doctl compute droplet create $DROPLET_NAME \
    --size $SIZE \
    --region $REGION \
    --image $IMAGE \
    --enable-ipv6 \
    --user-data-file -"

if [ -n "$SSH_KEY" ]; then
    CREATE_CMD="$CREATE_CMD --ssh-keys $SSH_KEY"
fi

echo "  Domain:   $DOMAIN"
echo "  Size:     $SIZE"
echo "  Region:   $REGION"
echo "  Droplet:  $DROPLET_NAME"
echo ""

echo ">>> Creating Droplet..."
$CREATE_CMD <<USERDATA
#!/bin/bash
set -e
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker
docker run -d \
    --name wonderspace \
    -p 80:80 -p 443:443 -p 7080:7080 \
    -v wonderspace-db:/var/lib/postgresql/data \
    -v wonderspace-caddy:/root/.local/share/caddy \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e CODER_ACCESS_URL=https://${DOMAIN} \
    -e CODER_WILDCARD_ACCESS_URL='*.ide.${DOMAIN}' \
    -e ENABLE_TLS=true \
    -e DOMAIN=${DOMAIN} \
    --restart unless-stopped \
    ghcr.io/wonderingtribe/wonderspace-ide:latest
USERDATA

echo ">>> Waiting for droplet to get IP..."
sleep 20

PUBLIC_IP=$(doctl compute droplet get "$DROPLET_NAME" --format PublicIPv4 --no-header)

echo ""
echo "============================================"
echo "  DigitalOcean Droplet Created!"
echo "============================================"
echo ""
echo "  Droplet:   $DROPLET_NAME"
echo "  Public IP: $PUBLIC_IP"
echo "  Dashboard: https://$DOMAIN"
echo ""
echo "  NEXT STEPS:"
echo "  1. Point DNS A records:"
echo "     $DOMAIN     -> $PUBLIC_IP"
echo "     *.ide.$DOMAIN -> $PUBLIC_IP"
echo ""
echo "  2. Wait ~2 minutes for Caddy to provision TLS"
echo ""
echo "  3. Open https://$DOMAIN and create your admin account"
echo "============================================"