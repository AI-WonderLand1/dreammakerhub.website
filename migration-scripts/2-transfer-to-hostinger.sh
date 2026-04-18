#!/bin/bash
# ============================================================================
# 2-transfer-to-hostinger.sh
# Run this ON YOUR ORACLE INSTANCE to transfer files to Hostinger
# ============================================================================

set -e

# Configuration - EDIT THESE
HOSTINGER_IP="${HOSTINGER_IP:-YOUR_HOSTINGER_IP_HERE}"
HOSTINGER_USER="${HOSTINGER_USER:-wonderuser}"
BACKUP_DIR="/tmp/wonderspace-migration"

echo "🚀 WonderSpace Migration - Transfer to Hostinger"
echo "================================================="
echo ""
echo "Target: $HOSTINGER_USER@$HOSTINGER_IP"
echo ""

# Check if files exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    echo "   Run ./1-export-from-oracle.sh first!"
    exit 1
fi

echo "📤 Transferring files to Hostinger..."
echo ""

# Create directory on Hostinger
ssh $HOSTINGER_USER@$HOSTINGER_IP "mkdir -p /tmp/wonderspace-migration"

# Transfer files with progress
rsync -avz --progress $BACKUP_DIR/ $HOSTINGER_USER@$HOSTINGER_IP:/tmp/wonderspace-migration/

echo ""
echo "================================================="
echo "✅ Transfer complete!"
echo ""
echo "Next steps:"
echo "1. SSH into Hostinger: ssh $HOSTINGER_USER@$HOSTINGER_IP"
echo "2. Run: ./migration-scripts/3-setup-hostinger.sh"
echo ""
echo "Or run remotely:"
echo "   ssh $HOSTINGER_USER@$HOSTINGER_IP 'bash -s' < 3-setup-hostinger.sh"
