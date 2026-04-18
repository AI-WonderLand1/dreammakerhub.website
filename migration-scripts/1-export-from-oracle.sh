#!/bin/bash
# ============================================================================
# 1-export-from-oracle.sh
# Run this ON YOUR ORACLE INSTANCE to export all data
# ============================================================================

set -e

# Configuration - EDIT THESE
ORACLE_IP="${ORACLE_IP:-YOUR_ORACLE_IP_HERE}"
HOSTINGER_IP="${HOSTINGER_IP:-YOUR_HOSTINGER_IP_HERE}"
DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-wonderspace_db}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="/tmp/wonderspace-migration"

echo "🚀 WonderSpace Migration - Export from Oracle"
echo "=============================================="
echo ""

# Create backup directory
mkdir -p $BACKUP_DIR
cd $BACKUP_DIR

echo "📦 Step 1: Exporting database..."
echo "   Database: $DB_NAME"
read -sp "   Enter database password: " DB_PASS
echo ""

PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > $BACKUP_DIR/database.sql
if [ $? -eq 0 ]; then
    echo "   ✅ Database exported successfully ($(du -h $BACKUP_DIR/database.sql | cut -f1))"
else
    echo "   ❌ Database export failed!"
    exit 1
fi

echo ""
echo "📦 Step 2: Exporting Kubernetes secrets..."
kubectl get secrets --all-namespaces -o yaml > $BACKUP_DIR/k8s-secrets.yaml
echo "   ✅ Secrets exported (REMOVE THIS FILE AFTER MIGRATION - contains sensitive data!)"

echo ""
echo "📦 Step 3: Exporting K8s manifests..."
kubectl get all --all-namespaces -o yaml > $BACKUP_DIR/k8s-resources.yaml
echo "   ✅ K8s resources exported"

echo ""
echo "📦 Step 4: Finding and backing up persistent volumes..."
# Get PV paths
kubectl get pv -o json | jq -r '.items[].spec.hostPath.path // .items[].spec.local.path // empty' > $BACKUP_DIR/pv-paths.txt

if [ -s $BACKUP_DIR/pv-paths.txt ]; then
    echo "   Found PV paths:"
    cat $BACKUP_DIR/pv-paths.txt
    
    # Create tarball of PV data
    echo "   Creating tarball of persistent data..."
    sudo tar -czf $BACKUP_DIR/persistent-volumes.tar.gz -T $BACKUP_DIR/pv-paths.txt 2>/dev/null || echo "   ⚠️  Some paths may require manual backup"
    echo "   ✅ Persistent volumes backed up ($(du -h $BACKUP_DIR/persistent-volumes.tar.gz 2>/dev/null | cut -f1 || echo 'partial'))"
else
    echo "   ⚠️  No hostPath/local PVs found - may be using cloud storage"
fi

echo ""
echo "📦 Step 5: Exporting Coder workspaces (if applicable)..."
CODER_PVS=$(kubectl get pv -o json | jq -r '.items[] | select(.spec.claimRef.name | contains("coder")) | .spec.hostPath.path' 2>/dev/null)
if [ -n "$CODER_PVS" ]; then
    echo "   Found Coder volumes:"
    echo "$CODER_PVS"
    sudo tar -czf $BACKUP_DIR/coder-workspaces.tar.gz $CODER_PVS 2>/dev/null
    echo "   ✅ Coder workspaces backed up"
else
    echo "   ℹ️  No Coder volumes found"
fi

echo ""
echo "📦 Step 6: Creating migration manifest..."
cat > $BACKUP_DIR/MANIFEST.txt << EOF
WonderSpace Migration Export
============================
Date: $(date)
Source: Oracle OKE

Files:
- database.sql: PostgreSQL dump of $DB_NAME
- k8s-secrets.yaml: Kubernetes secrets (SENSITIVE - DELETE AFTER USE)
- k8s-resources.yaml: All K8s resources
- persistent-volumes.tar.gz: PV data
- coder-workspaces.tar.gz: Coder workspace data (if applicable)
- pv-paths.txt: List of PV mount paths

Next Steps:
1. Transfer these files to Hostinger: ./2-transfer-to-hostinger.sh
2. Run setup on Hostinger: ./3-setup-hostinger.sh
3. Restore data on Hostinger: ./4-restore-on-hostinger.sh
EOF

echo "   ✅ Manifest created"

echo ""
echo "=============================================="
echo "✅ Export complete! Files in: $BACKUP_DIR"
echo ""
echo "📊 Export Summary:"
ls -lh $BACKUP_DIR/
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. k8s-secrets.yaml contains API keys - handle with care!"
echo "   2. Delete all backup files after successful migration"
echo "   3. Use secure method to transfer files (scp/rsync over VPN/SSH)"
echo ""
echo "Next: Run ./2-transfer-to-hostinger.sh to move files"
