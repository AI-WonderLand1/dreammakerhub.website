#!/bin/bash
# Wonderland IDE - OCI Connection Setup
# Run this after deploying to OKE to get connection details

echo "=== Wonderland IDE OCI Connection Info ==="
echo ""

# Get the LoadBalancer IP
INGRESS_IP=$(kubectl get svc wonderland-ide -n wonderland -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
if [ -z "$INGRESS_IP" ]; then
  INGRESS_IP=$(kubectl get svc wonderland-ide -n wonderland -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
fi

echo "🎯 IDE Access URL:"
if [ -n "$INGRESS_IP" ]; then
  echo "   http://${INGRESS_IP}:8080"
else
  echo "   (waiting for LoadBalancer...)"
fi

echo ""
echo "🔧 Local Development Config:"
echo ""
echo "To connect your local IDE to OCI, set these env vars:"
echo ""
echo "  export KUBECONFIG=/path/to/your/oke-kubeconfig"
echo "  export OKE_CLUSTER_IP=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}' | cut -d'/' -f3)"
echo ""
echo "=== kubectl access ==="
echo "Get kubeconfig from OCI Console:"
echo "  OCI → Kubernetes Cluster → Access → kubeconfig"
echo ""
echo "Test connection:"
echo "  kubectl get nodes"
echo "  kubectl get pods -n wonderland"
echo ""
echo "=== Port forward for local access ==="
echo "To access IDE locally:"
echo "  kubectl port-forward -n wonderland svc/wonderland-ide 8080:80"
echo ""
echo "Then open: http://localhost:8080"