#!/bin/bash
set -e

# ============================================
# DreamMakerHub - Full Coder + IDE Deployment
# ============================================
# Domain: dreammakerhub.website
# Email: aiwonderland111@gmail.com
#
# Prerequisites:
#   - OCI CLI configured (oci setup config)
#   - Docker installed
#   - kubectl configured for OKE cluster
#   - OCIR access
#
# Usage:
#   OCI_REGISTRY=iad.ocir.io/tenancy/wonderspace ./deploy-ide.sh [build|push|apply|all]

OCI_REGISTRY="${OCI_REGISTRY:-$1}"
IDE_IMAGE="${OCI_REGISTRY}/ide:latest"
DOMAIN="dreammakerhub.website"
NAMESPACE="wonderland"

if [ -z "$OCI_REGISTRY" ]; then
  echo "Usage: OCI_REGISTRY=iad.ocir.io/tenancy/wonderspace ./deploy-ide.sh [build|push|apply|all]"
  exit 1
fi

ACTION="${2:-all}"

build() {
  echo "=== Building IDE image ==="
  docker build -t "$IDE_IMAGE" -f packages/wonder-runtime/Dockerfile .
  echo "=== Built: $IDE_IMAGE ==="
}

push() {
  echo "=== Pushing to OCIR ==="
  docker push "$IDE_IMAGE"
  echo "=== Pushed: $IDE_IMAGE ==="
}

apply() {
  echo "=== Creating namespace ==="
  kubectl create namespace "$NAMESPACE" 2>/dev/null || true

  echo "=== Installing cert-manager ==="
  kubectl apply -f deploy/k8s/cert-manager.yaml
  echo "Waiting for cert-manager to be ready..."
  kubectl rollout status deployment/cert-manager -n cert-manager --timeout=120s 2>/dev/null || true

  echo "=== Deploying infrastructure ==="
  kubectl apply -f deploy/k8s/cluster-issuer.yaml
  kubectl apply -f deploy/k8s/configmap.yaml
  # Secrets are now managed via Vault (external-secrets)
  kubectl apply -f deploy/k8s/coder-db.yaml
  kubectl apply -f deploy/k8s/coder-deployment.yaml

  echo "=== Waiting for Coder DB ==="
  kubectl rollout status deployment/coder-db -n "$NAMESPACE" --timeout=120s

  echo "=== Waiting for Coder server ==="
  kubectl rollout status deployment/coder -n "$NAMESPACE" --timeout=180s

  echo "=== Deploying IDE workspace ==="
  kubectl apply -f deploy/k8s/ide-deployment.yaml
  kubectl set image deployment/wonderland-ide ide="$IDE_IMAGE" -n "$NAMESPACE"

  echo "=== Setting up ingress ==="
  kubectl apply -f deploy/k8s/ingress.yaml
  kubectl apply -f deploy/k8s/workspace-ingress.yaml

  echo ""
  echo "============================================"
  echo "  DreamMakerHub Deployment Summary"
  echo "============================================"
  echo ""
  echo "  Domain:        https://$DOMAIN"
  echo "  Coder:         https://$DOMAIN"
  echo "  IDE:           Each user gets a workspace via Coder"
  echo "  Email:         aiwonderland111@gmail.com"
  echo ""
  echo "  Next steps:"
  echo "  1. Point DNS A record for $DOMAIN to the LoadBalancer IP:"
  echo "     kubectl get svc -n ingress-nginx"
  echo ""
  echo "  2. Point DNS A record for *.ide.$DOMAIN to the same IP"
  echo ""
  echo "  3. Get Coder admin token:"
  echo "     kubectl logs deployment/coder -n $NAMESPACE | grep -i token"
  echo ""
  echo "  4. Login to Coder:"
  echo "     coder login https://$DOMAIN"
  echo ""
  echo "  5. Push the Coder template:"
  echo "     coder template push -d infra/coder/template wonderspace-ide"
  echo ""
  echo "  6. Create your first workspace:"
  echo "     coder create my-ide -t wonderspace-ide"
  echo ""
  echo "============================================"
}

case "$ACTION" in
  build)  build ;;
  push)   push ;;
  apply)  apply ;;
  all)    build; push; apply ;;
  *)      echo "Usage: ./deploy-ide.sh [build|push|apply|all]"; exit 1 ;;
esac