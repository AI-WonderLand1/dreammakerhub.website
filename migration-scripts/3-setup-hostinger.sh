#!/bin/bash
# ============================================================================
# 3-setup-hostinger.sh
# Run this ON YOUR HOSTINGER VPS to set up K3s, CloudPanel, and dependencies
# ============================================================================

set -e

# Configuration
DOMAIN="${DOMAIN:-dreammakerhub.website}"
EMAIL="${EMAIL:-your-email@example.com}"
USER_NAME="${USER_NAME:-wonderuser}"

echo "🚀 WonderSpace Migration - Setup Hostinger VPS"
echo "==============================================="
echo ""
echo "Domain: $DOMAIN"
echo "User: $USER_NAME"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use: sudo su)"
    exit 1
fi

echo "📦 Step 1: System update and essentials..."
apt update && apt upgrade -y
apt install -y curl wget git vim htop unzip fail2ban ufw software-properties-common apt-transport-https ca-certificates gnupg lsb-release

echo "✅ System updated"
echo ""

echo "📦 Step 2: Creating user $USER_NAME..."
if id "$USER_NAME" &>/dev/null; then
    echo "   User $USER_NAME already exists"
else
    adduser --gecos "" --disabled-password $USER_NAME
    usermod -aG sudo $USER_NAME
    echo "$USER_NAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
    echo "   ✅ User created"
fi
echo ""

echo "📦 Step 3: Setting hostname..."
hostnamectl set-hostname $DOMAIN
echo "127.0.0.1 $DOMAIN" >> /etc/hosts
echo "✅ Hostname set to $DOMAIN"
echo ""

echo "📦 Step 4: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER_NAME
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi
echo ""

echo "📦 Step 5: Installing K3s (without Traefik)..."
if ! command -v k3s &> /dev/null; then
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --disable=traefik --write-kubeconfig-mode=644" sh -
    
    # Setup kubeconfig for user
    mkdir -p /home/$USER_NAME/.kube
    cp /etc/rancher/k3s/k3s.yaml /home/$USER_NAME/.kube/config
    chown -R $USER_NAME:$USER_NAME /home/$USER_NAME/.kube
    
    # Add to bashrc
    echo "export KUBECONFIG=/home/$USER_NAME/.kube/config" >> /home/$USER_NAME/.bashrc
    
    echo "✅ K3s installed"
else
    echo "✅ K3s already installed"
fi
echo ""

echo "📦 Step 6: Installing kubectl..."
if ! command -v kubectl &> /dev/null; then
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
    echo "✅ kubectl installed"
else
    echo "✅ kubectl already installed"
fi
echo ""

echo "📦 Step 7: Installing Helm..."
if ! command -v helm &> /dev/null; then
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    echo "✅ Helm installed"
else
    echo "✅ Helm already installed"
fi
echo ""

echo "📦 Step 8: Installing CloudPanel..."
if [ ! -d "/usr/local/cloudpanel" ]; then
    curl -sSL https://installer.cloudpanel.io/ce/v2/install.sh | bash
    echo "✅ CloudPanel installed"
    echo ""
    echo "   🔑 Access CloudPanel at: https://$(curl -s ifconfig.me):8443"
    echo "   📝 Default admin credentials will be displayed above"
else
    echo "✅ CloudPanel already installed"
fi
echo ""

echo "📦 Step 9: Installing Nginx Ingress Controller for K3s..."
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

echo "⏳ Waiting for ingress controller..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

echo "✅ Ingress controller ready"
echo ""

echo "📦 Step 10: Setting up firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8443/tcp  # CloudPanel
ufw allow 6443/tcp  # K3s API
ufw allow 10250/tcp # Kubelet
ufw allow 2379/tcp  # etcd
ufw allow 2380/tcp  # etcd
ufw allow 8472/udp  # Flannel VXLAN
ufw --force enable

echo "✅ Firewall configured"
echo ""

echo "📦 Step 11: Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
    echo "✅ PostgreSQL installed"
else
    echo "✅ PostgreSQL already installed"
fi
echo ""

echo "📦 Step 12: Creating database..."
sudo -u postgres psql -c "CREATE USER wonderspace WITH PASSWORD 'wonderspace123';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE wonderspace_db OWNER wonderspace;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE wonderspace_db TO wonderspace;" 2>/dev/null || true
echo "✅ Database created"
echo ""

echo "==============================================="
echo "✅ Hostinger VPS setup complete!"
echo ""
echo "📋 Summary:"
echo "   🌐 Domain: $DOMAIN"
echo "   👤 User: $USER_NAME"
echo "   ☸️  K3s: $(k3s --version | head -1)"
echo "   🐳 Docker: $(docker --version)"
echo "   ⚓ Helm: $(helm version --short)"
echo ""
echo "🔑 Access Points:"
echo "   - CloudPanel: https://$(curl -s ifconfig.me):8443"
echo "   - K8s API: https://$(curl -s ifconfig.me):6443"
echo ""
echo "Next: Run ./4-restore-on-hostinger.sh to restore your data"
