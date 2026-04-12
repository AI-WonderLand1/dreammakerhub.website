#!/bin/bash
set -e

echo "============================================"
echo "  WonderSpace IDE - Azure Deployment"
echo "============================================"
echo ""
echo "  Prerequisites:"
echo "    - Azure CLI installed and logged in (az login)"
echo "    - A domain with DNS pointing to the instance"
echo ""

DOMAIN="${1:?Usage: $0 ide.yourdomain.com}"
VM_SIZE="${VM_SIZE:-Standard_D2s_v3}"
LOCATION="${AZ_LOCATION:-eastus}"
RG_NAME="wonderspace-${DOMAIN//./-}"
VM_NAME="wonderspace-${DOMAIN//./-}"

echo "  Domain:    $DOMAIN"
echo "  VM Size:  $VM_SIZE"
echo "  Location: $LOCATION"
echo "  RG:       $RG_NAME"
echo ""

echo ">>> Creating resource group..."
az group create --name "$RG_NAME" --location "$LOCATION" -o none

echo ">>> Creating VM with cloud-init..."
az vm create \
    --name "$VM_NAME" \
    --resource-group "$RG_NAME" \
    --location "$LOCATION" \
    --image Ubuntu2204 \
    --size "$VM_SIZE" \
    --os-disk-size-gb 50 \
    --public-ip-sku Standard \
    --custom-data - <<'CLOUDINIT'
#!/bin/bash
set -e
apt-get update && apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io
systemctl enable docker && systemctl start docker
docker run -d \
    --name wonderspace \
    -p 80:80 -p 443:443 -p 7080:7080 \
    -v wonderspace-db:/var/lib/postgresql/data \
    -v wonderspace-caddy:/root/.local/share/caddy \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e CODER_ACCESS_URL=https://DOMAIN_PLACEHOLDER \
    -e CODER_WILDCARD_ACCESS_URL='*.ide.DOMAIN_PLACEHOLDER' \
    -e ENABLE_TLS=true \
    -e DOMAIN=DOMAIN_PLACEHOLDER \
    --restart unless-stopped \
    ghcr.io/wonderingtribe/wonderspace-ide:latest
CLOUDINIT

echo ">>> Opening ports..."
az vm open-port --resource-group "$RG_NAME" --name "$VM_NAME" --port 80 --priority 1001 -o none
az vm open-port --resource-group "$RG_NAME" --name "$VM_NAME" --port 443 --priority 1002 -o none
az vm open-port --resource-group "$RG_NAME" --name "$VM_NAME" --port 7080 --priority 1003 -o none

PUBLIC_IP=$(az vm show -d -g "$RG_NAME" -n "$VM_NAME" --query publicIps -o tsv)

echo ""
echo "============================================"
echo "  Azure VM Launched!"
echo "============================================"
echo ""
echo "  VM:        $VM_NAME"
echo "  Public IP: $PUBLIC_IP"
echo "  Dashboard: https://$DOMAIN"
echo ""
echo "  NEXT STEPS:"
echo "  1. Point DNS A records:"
echo "     $DOMAIN     -> $PUBLIC_IP"
echo "     *.ide.$DOMAIN -> $PUBLIC_IP"
echo ""
echo "  2. SSH into the VM and replace DOMAIN_PLACEHOLDER:"
echo "     az ssh vm -g $RG_NAME -n $VM_NAME"
echo "     sed -i 's/DOMAIN_PLACEHOLDER/$DOMAIN/g' /var/log/cloud-init-output.log"
echo "     OR re-create the container with the correct domain"
echo ""
echo "  3. Open https://$DOMAIN and create your admin account"
echo "============================================"