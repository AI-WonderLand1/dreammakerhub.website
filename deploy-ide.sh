#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION="${1:-deploy}"

usage() {
  cat <<'EOF'
DreamMakerHub real IDE deployment

Usage:
  ./deploy-ide.sh deploy      Deploy Coder + Kubernetes workspace infrastructure
  ./deploy-ide.sh bootstrap   Install/upgrade ingress-nginx and cert-manager
  ./deploy-ide.sh all         Bootstrap, then deploy the IDE stack

This script intentionally does NOT build or launch the old shared coder-ide pod.
Each user workspace is provisioned by Coder from infra/coder/template/main.tf.
EOF
}

case "$ACTION" in
  deploy)
    exec "$ROOT/deploy/upcloud/deploy-k8s.sh"
    ;;
  bootstrap)
    exec "$ROOT/deploy/upcloud/bootstrap-k8s.sh"
    ;;
  all)
    "$ROOT/deploy/upcloud/bootstrap-k8s.sh"
    exec "$ROOT/deploy/upcloud/deploy-k8s.sh"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
