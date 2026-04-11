#!/bin/bash
set -e

# Wonderland Coder Setup Script for OKE
# This script helps set up Coder server on Oracle Kubernetes Engine

echo "🚀 Wonderland Coder Setup for OKE"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="wonderland"
CODER_VERSION="2.16.0"
CODER_DOMAIN="${CODER_DOMAIN:-coder.yourdomain.com}"

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl.${NC}"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    echo -e "${YELLOW}⚠️  Helm not found. Installing...${NC}"
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"

# Create namespace
echo -e "${BLUE}Creating namespace...${NC}"
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace "wonderland-workspaces" --dry-run=client -o yaml | kubectl apply -f -

# Add Coder Helm repo
echo -e "${BLUE}Adding Coder Helm repository...${NC}"
helm repo add coder-v2 https://helm.coder.com/v2
helm repo update

# Create values file for Coder
cat > /tmp/coder-values.yaml << EOF
coder:
  # Coder image
  image:
    repo: "ghcr.io/coder/coder"
    tag: "v${CODER_VERSION}"
  
  # Ingress configuration
  ingress:
    enable: true
    className: "nginx"
    host: "$CODER_DOMAIN"
    wildcardHost: "*.$CODER_DOMAIN"
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
      nginx.ingress.kubernetes.io/proxy-body-size: "0"
    tls:
      enable: true
      secretName: "coder-tls"
  
  # Environment variables
  env:
    - name: CODER_ACCESS_URL
      value: "https://$CODER_DOMAIN"
    - name: CODER_WILDCARD_ACCESS_URL
      value: "*.$CODER_DOMAIN"
    - name: CODER_PG_CONNECTION_URL
      valueFrom:
        secretKeyRef:
          name: coder-db
          key: url
    - name: CODER_OAUTH2_GITHUB_ALLOW_EVERYONE
      value: "true"
    # Uncomment and set for GitHub OAuth:
    # - name: CODER_OAUTH2_GITHUB_CLIENT_ID
    #   value: "your-github-app-client-id"
    # - name: CODER_OAUTH2_GITHUB_CLIENT_SECRET
    #   valueFrom:
    #     secretKeyRef:
    #       name: coder-oauth
    #       key: github-client-secret
  
  # Resource limits
  resources:
    requests:
      cpu: "500m"
      memory: "512Mi"
    limits:
      cpu: "2000m"
      memory: "2Gi"
  
  # Service account with K8s permissions
  serviceAccount:
    workspacePerms: true
EOF

echo -e "${GREEN}✓ Coder values file created${NC}"

# Create database secret (using built-in PostgreSQL for simplicity)
echo -e "${BLUE}Setting up database...${NC}"
kubectl create secret generic coder-db \
  --namespace="$NAMESPACE" \
  --from-literal=url="postgres://coder:coder@coder-db-postgresql:5432/coder?sslmode=disable" \
  --dry-run=client -o yaml | kubectl apply -f -

# Install PostgreSQL for Coder
echo -e "${BLUE}Installing PostgreSQL...${NC}"
helm repo add bitnami https://charts.bitnami.com/bitnami
helm upgrade --install coder-db bitnami/postgresql \
  --namespace "$NAMESPACE" \
  --set auth.username=coder \
  --set auth.password=coder \
  --set auth.database=coder \
  --set primary.persistence.enabled=true \
  --set primary.persistence.size=10Gi \
  --wait

echo -e "${GREEN}✓ PostgreSQL installed${NC}"

# Install Coder
echo -e "${BLUE}Installing Coder server...${NC}"
helm upgrade --install coder coder-v2/coder \
  --namespace "$NAMESPACE" \
  --version "${CODER_VERSION}" \
  --values /tmp/coder-values.yaml \
  --wait

echo -e "${GREEN}✓ Coder installed${NC}"

# Wait for Coder to be ready
echo -e "${BLUE}Waiting for Coder to be ready...${NC}"
kubectl rollout status deployment/coder -n "$NAMESPACE" --timeout=300s

# Create workspace service account
echo -e "${BLUE}Creating workspace service account...${NC}"
cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: coder-workspace
  namespace: wonderland-workspaces
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: coder-workspace
  namespace: wonderland-workspaces
rules:
- apiGroups: [""]
  resources: ["pods", "persistentvolumeclaims", "services"]
  verbs: ["*"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: coder-workspace
  namespace: wonderland-workspaces
subjects:
- kind: ServiceAccount
  name: coder-workspace
  namespace: wonderland-workspaces
roleRef:
  kind: Role
  name: coder-workspace
  apiGroup: rbac.authorization.k8s.io
EOF

echo -e "${GREEN}✓ Workspace RBAC configured${NC}"

# Get initial password
echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}✅ Coder Setup Complete!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "${BLUE}Access Coder at:${NC} https://$CODER_DOMAIN"
echo ""
echo -e "${YELLOW}Initial Setup:${NC}"
echo "1. Visit https://$CODER_DOMAIN"
echo "2. Set up your admin account"
echo "3. Configure GitHub OAuth (recommended)"
echo "4. Upload the Wonderland IDE template"
echo "5. Start creating workspaces!"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  cd kubernetes-devcontainer"
echo "  coder templates create wonderland-ide"
echo ""

# Cleanup
rm /tmp/coder-values.yaml
