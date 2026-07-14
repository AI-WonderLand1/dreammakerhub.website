#!/usr/bin/env bash
# deploy/civo/deploy.sh — Deploy IDEs to Civo Kubernetes
#
# Components deployed:
#   - Coder Control Plane
#   - Node IDE template
#   - Python IDE template
#   - Coder workspaces
#
# Prerequisites:
#   - kubectl configured for Civo cluster
#   - OCI CLI configured (for image pulls)
#
# Usage:
#   ./deploy/civo/deploy.sh [apply|status|delete]

set -uo pipefail
LOG=/tmp/civo-deploy.log
exec > >(tee -a "$LOG") 2>&1
echo "=== [$(date -u)] Civo IDE deployment start ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ACTION="${1:-apply}"
NAMESPACE="coder"

case "$ACTION" in
  apply)
    echo "=== Deploying IDEs to Civo ==="
    
    # Apply Coder control plane
    kubectl apply -f "$REPO_ROOT/deploy/k8s/namespace.yaml" 2>/dev/null || true
    kubectl apply -f "$REPO_ROOT/deploy/k8s/coder-config.yaml"
    kubectl apply -f "$REPO_ROOT/deploy/k8s/coder-db.yaml"
    kubectl apply -f "$REPO_ROOT/deploy/k8s/coder-deployment.yaml"
    
    # Apply IDE deployment
    kubectl apply -f "$REPO_ROOT/deploy/k8s/ide-deployment.yaml"
    
    # Apply ingress
    kubectl apply -f "$REPO_ROOT/deploy/k8s/ingress.yaml"
    kubectl apply -f "$REPO_ROOT/deploy/k8s/workspace-ingress.yaml"
    
    # Apply TLS
    kubectl apply -f "$REPO_ROOT/deploy/k8s/cert-manager.yaml"
    kubectl apply -f "$REPO_ROOT/deploy/k8s/cluster-issuer.yaml"
    
    echo "=== IDEs deployed to Civo ==="
    echo "DNS records to configure:"
    echo "  ide.dreammakerhub.website -> Civo LoadBalancer IP"
    echo "  *.coder.dreammakerhub.website -> Civo LoadBalancer IP"
    ;;
    
  status)
    echo "=== Civo IDE deployment status ==="
    kubectl get pods -n $NAMESPACE
    kubectl get services -n $NAMESPACE
    kubectl get ingress -n $NAMESPACE
    ;;
    
  delete)
    echo "=== Deleting Civo IDE deployment ==="
    kubectl delete -f "$REPO_ROOT/deploy/k8s/ingress.yaml" --ignore-not-found
    kubectl delete -f "$REPO_ROOT/deploy/k8s/workspace-ingress.yaml" --ignore-not-found
    kubectl delete -f "$REPO_ROOT/deploy/k8s/ide-deployment.yaml" --ignore-not-found
    kubectl delete -f "$REPO_ROOT/deploy/k8s/coder-deployment.yaml" --ignore-not-found
    kubectl delete -f "$REPO_ROOT/deploy/k8s/coder-db.yaml" --ignore-not-found
    kubectl delete namespace $NAMESPACE --ignore-not-found
    ;;
    
  *)
    echo "Usage: $0 [apply|status|delete]"
    exit 1
    ;;
esac

echo "=== [$(date -u)] Civo IDE deployment done ==="
