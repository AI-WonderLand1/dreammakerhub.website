#!/bin/bash
set -e

echo "============================================"
echo "  WonderSpace IDE - AWS EC2 Deployment"
echo "============================================"
echo ""
echo "  Prerequisites:"
echo "    - AWS CLI configured (aws configure)"
echo "    - An EC2 key pair created"
echo "    - A domain with DNS pointing to the instance"
echo ""

DOMAIN="${1:?Usage: $0 ide.yourdomain.com}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.medium}"
KEY_NAME="${KEY_NAME:-${DOMAIN//./-}}"
REGION="${AWS_REGION:-us-east-1}"
IMAGE="${AWS_IMAGE:-ami-0c7217cdde311cf76}"

echo "  Domain:      $DOMAIN"
echo "  Instance:   $INSTANCE_TYPE"
echo "  Region:     $REGION"
echo "  Key pair:   $KEY_NAME"
echo ""

echo ">>> Creating security group..."
SG_ID=$(aws ec2 create-security-group \
    --group-name "wonderspace-${DOMAIN//./-}" \
    --description "WonderSpace IDE for $DOMAIN" \
    --region "$REGION" \
    --query 'GroupId' --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
    --group-names "wonderspace-${DOMAIN//./-}" \
    --region "$REGION" \
    --query 'SecurityGroups[0].GroupId' --output text)

aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "$REGION" 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION" 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$REGION" 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 7080 --cidr 0.0.0.0/0 --region "$REGION" 2>/dev/null || true

echo ">>> Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$IMAGE" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --user-data "$(cat <<EOF
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
EOF
)" \
    --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":50,"VolumeType":"gp3"}}]' \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=wonderspace-${DOMAIN//./-}}]" \
    --region "$REGION" \
    --query 'Instances[0].InstanceId' --output text)

echo ">>> Instance $INSTANCE_ID launching..."
echo ">>> Waiting for public IP..."
sleep 30

PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo ""
echo "============================================"
echo "  EC2 Instance Launched!"
echo "============================================"
echo ""
echo "  Instance ID:  $INSTANCE_ID"
echo "  Public IP:     $PUBLIC_IP"
echo "  Dashboard:     https://$DOMAIN"
echo ""
echo "  NEXT STEPS:"
echo "  1. Point DNS A records:"
echo "     $DOMAIN     -> $PUBLIC_IP"
echo "     *.ide.$DOMAIN -> $PUBLIC_IP"
echo ""
echo "  2. Wait ~2 minutes for Caddy to provision TLS certificate"
echo ""
echo "  3. Open https://$DOMAIN and create your admin account"
echo ""
echo "  SSH: ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@$PUBLIC_IP"
echo "============================================"