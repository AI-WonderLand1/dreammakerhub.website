#!/bin/bash
set -e

# === Wonderland IDE - OCI Deploy Script ===
# Usage: ./deploy-ide.sh [push|apply|all]
#
# Prerequisites:
#   - OCI CLI configured
#   - Docker installed  
#   - kubectl configured for OKE cluster
#   - OCIR (Oracle Container Registry) access
#
# Usage:
#   OCI_REGISTRY=iad.ocir.io/your-tenancy/wonderspace ./deploy-ide.sh all
#   ./deploy-ide.sh iad.ocir.io/your-tenancy/wonderspace apply

OCI_REGISTRY="${OCI_REGISTRY:-$1}"
OCI_REGION="${OCI_REGION:-us-chicago-1}"
IDE_IMAGE="${OCI_REGISTRY}/ide:latest"

if [ -z "$OCI_REGISTRY" ]; then
  echo "Usage: OCI_REGISTRY=iad.ocir.io/your-tenancy/wonderspace ./deploy-ide.sh [push|apply|all]"
  echo "  or:  ./deploy-ide.sh iad.ocir.io/your-tenancy/wonderspace apply"
  exit 1
fi

ACTION="${2:-all}"

# === BUILD ===
build() {
  echo "=== Building IDE image ==="
  docker build -t "$IDE_IMAGE" -f Dockerfile.workspace .
  echo "=== Build complete: $IDE_IMAGE ==="
}

# === PUSH ===
push() {
  echo "=== Logging into OCIR ==="
  echo "$OCI_REGISTRY" | docker login --username=oracle --password-stdin "$OCI_REGISTRY" 2>/dev/null || \
  docker login "$OCI_REGISTRY"
  
  echo "=== Pushing IDE image ==="
  docker push "$IDE_IMAGE"
  echo "=== Push complete ==="
}

# === DEPLOY ===
apply() {
  echo "=== Applying IDE to OKE ==="
  kubectl apply -f deploy/k8s/namespace.yaml
  kubectl apply -f deploy/k8s/ide-deployment.yaml
  
  # Update image
  kubectl set image deployment/wonderland-ide ide="$IDE_IMAGE" -n wonderland
  
  echo "=== Waiting for rollout ==="
  kubectl rollout status deployment/wonderland-ide -n wonderland --timeout=300s
  
  echo "=== Deployed! ==="
  echo ""
  echo "Get the endpoint:"
  echo "  kubectl get svc wonderland-ide -n wonderland"
  echo ""
  echo "Or run: ./connect-oci.sh"
}

case "$ACTION" in
  build)  build ;;
  push)   push ;;
  apply)  apply ;;
  all)    build; push; apply ;;
  *)      echo "Usage: ./deploy-ide.sh [push|apply|all]"; exit 1 ;;
esac