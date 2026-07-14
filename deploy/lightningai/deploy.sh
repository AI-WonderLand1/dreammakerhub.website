#!/usr/bin/env bash
# deploy/lightningai/deploy.sh — Deploy 3D software to LightningAI
#
# Components deployed:
#   - PlayCanvas Engine (3D editor)
#   - WebGLStudio Engine (shader editor)
#   - WonderRuntime (3D runtime)
#
# Prerequisites:
#   - kubectl configured for LightningAI cluster
#   - Docker image built and pushed to LightningAI registry
#
# Usage:
#   ./deploy/lightningai/deploy.sh [apply|status|delete]

set -uo pipefail
LOG=/tmp/lightningai-deploy.log
exec > >(tee -a "$LOG") 2>&1
echo "=== [$(date -u)] LightningAI 3D deployment start ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ACTION="${1:-apply}"
NAMESPACE="lightningai-3d"

case "$ACTION" in
  apply)
    echo "=== Deploying 3D software to LightningAI ==="
    
    # Apply 3D engine deployments
    kubectl apply -f "$REPO_ROOT/infra/wonder-runtime/"
    
    # Apply 3D engine services
    kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: playcanvas-engine
  namespace: $NAMESPACE
spec:
  type: ClusterIP
  ports:
  - port: 31000
    targetPort: 31000
    protocol: TCP
    name: playcanvas
  selector:
    app: playcanvas-engine
---
apiVersion: v1
kind: Service
metadata:
  name: webglstudio-engine
  namespace: $NAMESPACE
spec:
  type: ClusterIP
  ports:
  - port: 31001
    targetPort: 31001
    protocol: TCP
    name: webglstudio
  selector:
    app: webglstudio-engine
EOF
    
    echo "=== 3D software deployed to LightningAI ==="
    echo "DNS records to configure:"
    echo "  play.dreammakerhub.website -> LightningAI ingress IP"
    echo "  wonderplay.dreammakerhub.website -> LightningAI ingress IP"
    echo "  playcanvas.dreammakerhub.website -> LightningAI ingress IP"
    ;;
    
  status)
    echo "=== LightningAI 3D deployment status ==="
    kubectl get pods -n $NAMESPACE
    kubectl get services -n $NAMESPACE
    ;;
    
  delete)
    echo "=== Deleting LightningAI 3D deployment ==="
    kubectl delete -f "$REPO_ROOT/infra/wonder-runtime/" --ignore-not-found
    kubectl delete namespace $NAMESPACE --ignore-not-found
    ;;
    
  *)
    echo "Usage: $0 [apply|status|delete]"
    exit 1
    ;;
esac

echo "=== [$(date -u)] LightningAI 3D deployment done ==="
