#!/bin/bash
set -e

echo "============================================"
echo "  WonderSpace IDE - Oracle Cloud Deployment"
echo "============================================"
echo ""
echo "  Prerequisites:"
echo "    - OCI CLI configured (oci setup config)"
echo "    - An OCI compartment OCID"
echo "    - A domain with DNS pointing to the instance"
echo ""

DOMAIN="${1:?Usage: $0 ide.yourdomain.com}"
SHAPE="${OCI_SHAPE:-VM.Standard.E4.Flex}"
CPU="${OCI_CPU:-2}"
MEMORY="${OCI_MEMORY:-12}"
COMPARTMENT="${OCI_COMPARTMENT:-$(oci iam compartment list --query 'data[0].id' --raw-output 2>/dev/null || echo '')}"
AD="${OCI_AD:-$(oci iam availability-domain list --query 'data[0].name' --raw-output)}"
IMAGE="${OCI_IMAGE:-ocid1.image.oc1.iad.aaaaaaaaf7hv5t5jyyo7wyu2quzjbdd2x3bvh3v3px67ads5w7k4dywdrsqa}"

if [ -z "$COMPARTMENT" ]; then
    echo "ERROR: Set OCI_COMPARTMENT to your compartment OCID"
    exit 1
fi

echo "  Domain:      $DOMAIN"
echo "  Shape:       $SHAPE"
echo "  Compartment: $COMPARTMENT"
echo ""

echo ">>> Creating OCI instance..."

SSH_PUBLIC_KEY="${SSH_PUBLIC_KEY:-$(cat ~/.ssh/id_rsa.pub 2>/dev/null || cat ~/.ssh/id_ed25519.pub 2>/dev/null)}"
if [ -z "$SSH_PUBLIC_KEY" ]; then
    echo "ERROR: No SSH public key found. Set SSH_PUBLIC_KEY or create ~/.ssh/id_rsa.pub"
    exit 1
fi

INSTANCE_ID=$(oci compute instance launch \
    --compartment-id "$COMPARTMENT" \
    --availability-domain "$AD" \
    --shape "$SHAPE" \
    --shape-config "{\"ocpus\": $CPU, \"memoryInGBs\": $MEMORY}" \
    --source-details "{\"imageId\": \"$IMAGE\", \"bootVolumeSizeInGBs\": 50}" \
    --display-name "wonderspace-${DOMAIN//./-}" \
    --metadata "{\"ssh_authorized_keys\": \"$SSH_PUBLIC_KEY\"}" \
    --user-data "$(echo '#!/bin/bash
set -e
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker
docker run -d \
    --name wonderspace \
    -p 80:80 -p 443:443 -p 7080:7080 \
    -v wonderspace-db:/var/lib/postgresql/data \
    -v wonderspace-caddy:/root/.local/share/caddy \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e CODER_ACCESS_URL=https://'"'"''"${DOMAIN}"'"'"''"'"'"' \
    -e CODER_WILDCARD_ACCESS_URL='"'"'"'*.ide.'"'"''"${DOMAIN}"'"'"''"'"'"' \
    -e ENABLE_TLS=true \
    -e DOMAIN='"'"''"${DOMAIN}"'"'"''"'"'"' \
    --restart unless-stopped \
    ghcr.io/wonderingtribe/wonderspace-ide:latest' | base64 -w0)" \
    --query 'data.id' --raw-output)

echo ">>> Instance $INSTANCE_ID creating..."
echo ">>> Waiting for public IP..."
sleep 60

PUBLIC_IP=$(oci compute instance list-vnics \
    --instance-id "$INSTANCE_ID" \
    --query 'data[0]."public-ip"' --raw-output 2>/dev/null || echo "pending")

echo ""
echo "============================================"
echo "  OCI Instance Launched!"
echo "============================================"
echo ""
echo "  Instance ID: $INSTANCE_ID"
echo "  Public IP:   $PUBLIC_IP"
echo "  Dashboard:   https://$DOMAIN"
echo ""
echo "  NEXT STEPS:"
echo "  1. Point DNS A records:"
echo "     $DOMAIN     -> $PUBLIC_IP"
echo "     *.ide.$DOMAIN -> $PUBLIC_IP"
echo ""
echo "  2. Open OCI Security List and add ingress rules:"
echo "     TCP 80, 443, 7080 from 0.0.0.0/0"
echo ""
echo "  3. Wait ~2 minutes for Caddy to provision TLS"
echo ""
echo "  4. Open https://$Domain and create your admin account"
echo "============================================"