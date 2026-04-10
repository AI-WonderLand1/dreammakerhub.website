#!/bin/bash
set -e

# === Wonderland OCI Deploy Script ===
# Usage: ./deploy.sh [push|apply|all]
#
# Prerequisites:
#   - OCI CLI configured (oci setup config)
#   - Docker installed
#   - kubectl configured for your OKE cluster
#   - ocir (Oracle Cloud Infrastructure Registry) selected region
#
# Required env vars:
#   OCI_REGISTRY   — e.g., iad.ocir.io/your-tenancy/wonderspace
#   OCI_REGION      — e.g., us-chicago-1

OCI_REGISTRY="${OCI_REGISTRY:-$1}"
OCI_REGION="${OCI_REGION:-us-chicago-1}"
WEB_IMAGE="${OCI_REGISTRY}/web:latest"
WORKSPACE_IMAGE="${OCI_REGISTRY}/workspace:latest"

if [ -z "$OCI_REGISTRY" ]; then
  echo "Usage: OCI_REGISTRY=iad.ocir.io/your-tenancy/wonderspace ./deploy.sh [push|apply|all]"
  echo "  or:  ./deploy.sh iad.ocir.io/your-tenancy/wonderspace [push|apply|all]"
  exit 1
fi

ACTION="${2:-all}"

# === BUILD ===
build() {
  echo "=== Building workspace image ==="
  docker build -t "$WORKSPACE_IMAGE" \
    -f Dockerfile.workspace \
    --build-arg BASE_IMAGE=codercom/code-server:latest \
    .

  echo "=== Building web app image ==="
  docker build -t "$WEB_IMAGE" \
    -f Dockerfile.editor \
    .

  echo "=== Build complete ==="
}

# === PUSH ===
push() {
  echo "=== Logging into OCIR ==="
  docker login "$OCI_REGISTRY"

  echo "=== Pushing workspace image ==="
  docker push "$WORKSPACE_IMAGE"

  echo "=== Pushing web app image ==="
  docker push "$WEB_IMAGE"

  echo "=== Push complete ==="
}

# === DEPLOY K8S ===
apply() {
  echo "=== Applying Kubernetes manifests ==="
  kubectl apply -f deploy/k8s/namespace.yaml
  kubectl apply -f deploy/k8s/cert-manager.yaml
  kubectl apply -f deploy/k8s/cluster-issuer.yaml
  kubectl apply -f deploy/k8s/configmap.yaml
  kubectl apply -f deploy/k8s/secret.yaml

  # Update image references
  kubectl set image deployment/wonderland-web \
    web="$WEB_IMAGE" \
    -n wonderland

  kubectl set image deployment/wonderland-workspace \
    code-server="$WORKSPACE_IMAGE" \
    -n wonderland

  kubectl apply -f deploy/k8s/web-deployment.yaml
  kubectl apply -f deploy/k8s/web-service.yaml
  kubectl apply -f deploy/k8s/workspace-deployment.yaml
  kubectl apply -f deploy/k8s/ingress.yaml

  echo "=== Rolling out updates ==="
  kubectl rollout status deployment/wonderland-web -n wonderland --timeout=300s
  kubectl rollout status deployment/wonderland-workspace -n wonderland --timeout=300s

  echo "=== Deploy complete ==="
  echo ""
  echo "Pods:"
  kubectl get pods -n wonderland
  echo ""
  echo "Services:"
  kubectl get svc -n wonderland
  echo ""
  echo "Ingress:"
  kubectl get ingress -n wonderland
}

case "$ACTION" in
  build)  build ;;
  push)   push ;;
  apply)  apply ;;
  all)
    build
    push
    apply
    ;;
  *)
    echo "Unknown action: $ACTION"
    echo "Usage: ./deploy.sh [push|apply|all]"
    exit 1
    ;;
esac
