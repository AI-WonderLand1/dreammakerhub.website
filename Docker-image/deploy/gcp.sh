#!/bin/bash
set -e

echo "============================================"
echo "  WonderSpace IDE - Google Cloud Deployment"
echo "============================================"
echo ""
echo "  Prerequisites:"
echo "    - gcloud CLI installed and authenticated"
echo "    - A domain with DNS pointing to the instance"
echo ""

DOMAIN="${1:?Usage: $0 ide.yourdomain.com}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-medium}"
ZONE="${GCP_ZONE:-us-central1-a}"
PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
INSTANCE_NAME="wonderspace-${DOMAIN//./-}"

echo "  Domain:      $DOMAIN"
echo "  Machine:     $MACHINE_TYPE"
echo "  Zone:        $ZONE"
echo "  Project:     $PROJECT"
echo "  Instance:    $INSTANCE_NAME"
echo ""

echo ">>> Creating firewall rules..."
gcloud compute firewall-rules create wonderspace-allow-http \
    --allow tcp:80,tcp:443,tcp:7080 \
    --source-ranges 0.0.0.0/0 \
    --project "$PROJECT" 2>/dev/null || true

echo ">>> Creating VM instance..."
gcloud compute instances create "$INSTANCE_NAME" \
    --machine-type="$MACHINE_TYPE" \
    --zone="$ZONE" \
    --project="$PROJECT" \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=50GB \
    --metadata=startup-script="#!/bin/bash
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
    ghcr.io/wonderingtribe/wonderspace-ide:latest" \
    --tags=http-server,https-server

echo ">>> Waiting for instance to get external IP..."
sleep 20

PUBLIC_IP=$(gcloud compute instances describe "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT" \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "============================================"
echo "  GCP Instance Launched!"
echo "============================================"
echo ""
echo "  Instance:  $INSTANCE_NAME"
echo "  Public IP: $PUBLIC_IP"
echo "  Dashboard: https://$DOMAIN"
echo ""
echo "  NEXT STEPS:"
echo "  1. Point DNS A records:"
echo "     $DOMAIN     -> $PUBLIC_IP"
echo "     *.ide.$DOMAIN -> $PUBLIC_IP"
echo ""
echo "  2. Wait ~2 minutes for Caddy to provision TLS certificate"
echo ""
echo "  3. Open https://$Domain and create your admin account"
echo ""
echo "  SSH: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "============================================"