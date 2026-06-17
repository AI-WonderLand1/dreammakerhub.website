#!/bin/bash
# ============================================================================
# 4-restore-on-hostinger.sh
# Run this ON YOUR HOSTINGER VPS to restore data from Oracle
# ============================================================================

set -e

# Configuration
BACKUP_DIR="/tmp/wonderspace-migration"
DB_NAME="${DB_NAME:-wonderspace_db}"
DB_USER="${DB_USER:-wonderspace}"
NAMESPACE="${NAMESPACE:-wonderspace}"

echo "🚀 WonderSpace Migration - Restore on Hostinger"
echo "================================================"
echo ""

# Check if backup exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    echo "   Run transfer script first!"
    exit 1
fi

cd $BACKUP_DIR

echo "📦 Step 1: Restoring database..."
if [ -f "database.sql" ]; then
    echo "   Dropping existing database..."
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    echo "   Restoring from backup..."
    sudo -u postgres psql $DB_NAME < database.sql
    echo "   ✅ Database restored"
else
    echo "   ⚠️  database.sql not found, skipping"
fi
echo ""

echo "📦 Step 2: Creating Kubernetes namespace..."
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
kubectl create namespace $NAMESPACE 2>/dev/null || echo "   Namespace $NAMESPACE already exists"
echo ""

echo "📦 Step 3: Restoring persistent volumes..."
if [ -f "persistent-volumes.tar.gz" ]; then
    echo "   Extracting PV data..."
    mkdir -p /var/lib/rancher/k3s/storage
    tar -xzf persistent-volumes.tar.gz -C /var/lib/rancher/k3s/storage/
    chown -R 1000:1000 /var/lib/rancher/k3s/storage/
    echo "   ✅ Persistent volumes restored"
else
    echo "   ⚠️  persistent-volumes.tar.gz not found"
fi
echo ""

echo "📦 Step 4: Restoring Coder workspaces..."
if [ -f "coder-workspaces.tar.gz" ]; then
    echo "   Extracting Coder workspace data..."
    mkdir -p /var/lib/rancher/k3s/storage/coder-workspaces
    tar -xzf coder-workspaces.tar.gz -C /var/lib/rancher/k3s/storage/coder-workspaces/
    chown -R 1000:1000 /var/lib/rancher/k3s/storage/coder-workspaces/
    echo "   ✅ Coder workspaces restored"
else
    echo "   ℹ️  No Coder workspace backup found"
fi
echo ""

echo "📦 Step 5: Setting up Secrets..."
echo "   You'll need to create secrets manually or from environment variables"
echo ""

# Check if secrets file exists
if [ -f "k8s-secrets.yaml" ]; then
    echo "   ⚠️  Found k8s-secrets.yaml from Oracle"
    echo "   ⚠️  WARNING: This contains sensitive data!"
    echo ""
    read -p "   Apply secrets from backup? (y/N): " apply_secrets
    if [[ $apply_secrets =~ ^[Yy]$ ]]; then
        kubectl apply -f k8s-secrets.yaml -n $NAMESPACE
        echo "   ✅ Secrets applied"
    else
        echo "   ℹ️  Skipping secrets - you'll need to create them manually"
    fi
else
    echo "   ℹ️  No secrets backup found"
fi
echo ""

echo "📦 Step 6: Creating example secrets template..."
cat > $BACKUP_DIR/create-secrets.sh << 'EOF'
#!/bin/bash
# Run this to create secrets manually

NAMESPACE="wonderspace"

kubectl create secret generic wonderspace-secrets \
  --namespace=$NAMESPACE \
  --from-literal=OPENCODE_API_KEY="op-your-key-here" \
  --from-literal=SUPABASE_URL="https://your-project.supabase.co" \
  --from-literal=SUPABASE_KEY="your-anon-key" \
<<<<<<< HEAD
  --from-literal=DATABASE_URL="postgres://wonderspace:wonderspace123@localhost:5432/wonderspace_db" \
=======
  --from-literal=DATABASE_URL="postgres://wonderspace:${DB_PASSWORD}@localhost:5432/wonderspace_db" \
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
  --from-literal=CODER_ACCESS_URL="http://localhost:7080" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secrets created"
EOF

chmod +x $BACKUP_DIR/create-secrets.sh
echo "   ✅ Template created at: $BACKUP_DIR/create-secrets.sh"
echo "   📝 Edit this file with your actual values, then run it"
echo ""

echo "================================================"
echo "✅ Restore complete!"
echo ""
echo "Next steps:"
echo "1. Edit and run: $BACKUP_DIR/create-secrets.sh"
echo "2. Deploy your engines: kubectl apply -f k8s/"
echo "3. Verify: kubectl get pods -n $NAMESPACE"
echo ""
echo "🧹 Cleanup (after verifying everything works):"
echo "   rm -rf $BACKUP_DIR"
echo "   rm -f k8s-secrets.yaml  # Contains sensitive data!"
