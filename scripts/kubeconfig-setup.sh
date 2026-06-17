#!/bin/bash
# kubeconfig-setup.sh - Setup kubectl access for WonderSpace
# Run from Crostini/Crosh terminal: chmod +x kubeconfig-setup.sh && ./kubeconfig-setup.sh

set -e

KUBECONFIG_DIR="$HOME/.kube"
KUBECONFIG_FILE="$KUBECONFIG_DIR/config"
ORAKE_KUBECONFIG="${KUBECONFIG_DIR}/oracle-kubeconfig"

echo "🔧 WonderSpace Kubeconfig Setup"
echo "========================="

# Detect environment
if command -v kubectl &> /dev/null; then
  echo "✓ kubectl already installed"
  KUBECTL_VERSION=$(kubectl version --client -o json 2>/dev/null | grep -o '"gitVersion": "[^"]*"' | cut -d'"' -f4 || echo "unknown")
  echo "  Version: $KUBECTL_VERSION"
else
  echo "✗ kubectl not found"
  echo ""
  echo "Installing kubectl..."
  
  # Detect OS
  if [[ "$OSTYPE" == "linux-android" ]]; then
    echo "  Detected: Chrome OS (Crostini)"
    curl -LO "https://dl.k8s.io/release/v1.28.0/bin/linux/amd64/kubectl"
    chmod +x kubectl
    sudo mv kubectl /usr/local/bin/
  else
    echo "  Detected: Linux"
    curl -LO "https://dl.k8s.io/release/v1.28.0/bin/linux/amd64/kubectl"
    chmod +x kubectl
    sudo mv kubectl /usr/local/bin/
  fi
  echo "✓ kubectl installed"
fi

# Create kube dir
mkdir -p "$KUBECONFIG_DIR"
chmod 700 "$KUBECONFIG_DIR"

echo ""
echo "📋 Kubeconfig Options:"
echo ""
echo "1. Oracle Cloud Infrastructure (OKE)"
echo "   - Get kubeconfig from OCI Console > Developer Services > Kubernetes Clusters"
echo "   - Or use OCI CLI: oci ce cluster create-kubeconfig --cluster-id <cluster-ocid>"
echo ""
echo "2. Generic kubeconfig file"
echo "   - Provide path to existing kubeconfig"
echo ""

read -p "Select option (1/2) or paste kubeconfig URL: " choice

case $choice in
  1)
    echo ""
    echo "For Oracle OKE:"
    echo "1. Go to OCI Console > Developer Services > Kubernetes Clusters"
    echo "2. Select your cluster > Click 'Access Cluster' button"
    echo "3. Run the 'oci ce cluster create-kubeconfig' command shown"
    echo "4. Or manually download the kubeconfig file"
    echo ""
    read -p "Paste the full path to your OKE kubeconfig file: " KUBECONFIG_PATH
    if [ -f "$KUBECONFIG_PATH" ]; then
      cp "$KUBECONFIG_PATH" "$ORAKE_KUBECONFIG"
      chmod 600 "$ORAKE_KUBECONFIG"
      export KUBECONFIG="$ORAKE_KUBECONFIG"
      echo "✓ Oracle kubeconfig saved to $ORAKE_KUBECONFIG"
    fi
    ;;
  2)
    echo ""
    read -p "Enter path to kubeconfig file: " KUBECONFIG_PATH
    if [ -f "$KUBECONFIG_PATH" ]; then
      cp "$KUBECONFIG_PATH" "$ORAKE_KUBECONFIG"
      chmod 600 "$ORAKE_KUBECONFIG"
      echo "✓ kubeconfig saved"
    else
      echo "✗ File not found"
      exit 1
    fi
    ;;
  *)
    echo "Please download kubeconfig from your cloud provider and run this script again"
    exit 1
    ;;
esac

# Verify connection
echo ""
echo "🔍 Testing cluster connection..."
export KUBECONFIG="$ORAKE_KUBECONFIG"

if kubectl cluster-info &> /dev/null; then
  echo "✓ Connected to cluster!"
  echo ""
  kubectl cluster-info
  echo ""
  echo "📊 Cluster Status:"
  kubectl get nodes 2>/dev/null || kubectl get pods -A 2>/dev/null || echo "  (Limited access)"
else
  echo "✗ Connection failed. Check your kubeconfig."
fi

echo ""
echo "💡 To verify Supabase secrets, run:"
echo "   kubectl get secrets -n coder | grep -i supabase"
echo ""
echo "💡 To check pods, run:"
echo "   kubectl get pods -n coder"