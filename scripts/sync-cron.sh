#!/bin/bash
# Asset Sync Cron - Run weekly on VPS
# Add to crontab: 0 2 * * 0 /home/dreammakerhub/htdocs/dreammakerhub.website/psychic-octo-fishstick/scripts/sync-cron.sh >> /var/log/asset-sync.log 2>&1

cd /home/dreammakerhub/htdocs/dreammakerhub.website/psychic-octo-fishstick

echo "==== Asset Sync Started: $(date) ===="

# Load environment
source .env.local 2>/dev/null || source .env 2>/dev/null

# Run the sync
npx tsx scripts/sync-assets.ts

RESULT=$?
echo "==== Asset Sync Finished: $(date) (Exit code: $RESULT) ===="

exit $RESULT