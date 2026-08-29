#!/usr/bin/env bash
# deploy/upcloud/scripts/update-cloudflare-dns.sh — Bulk update DNS from Railway to UpCloud
#
# Replaces all CNAME records pointing to Railway with A records pointing to 152.44.43.125
#
# Usage:
#   export CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
#   export CLOUDFLARE_ZONE_ID=your-zone-id
#   bash deploy/upcloud/scripts/update-cloudflare-dns.sh

set -uo pipefail

API_TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN required}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID required}"
UPLOAD_IP="152.44.43.125"
API="https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records"

# DNS records to update from CNAME (Railway) to A (UpCloud)
declare -a RECORDS=(
  "dreammakerhub.website"
  "www.dreammakerhub.website"
  "ide.dreammakerhub.website"
  "play.dreammakerhub.website"
  "playground.dreammakerhub.website"
  "wonderplay-3d.dreammakerhub.website"
  "civo-test.dreammakerhub.website"
)

echo "=== [$(date -u)] Cloudflare DNS bulk update ==="
echo "Zone: ${ZONE_ID}"
echo "Target IP: ${UPLOAD_IP}"
echo ""

for RECORD in "${RECORDS[@]}"; do
  echo "--- Processing ${RECORD} ---"

  # Get existing record ID(s) for this name
  RESPONSE=$(curl -s -X GET "${API}" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data-binary "{\"name\":\"${RECORD}\",\"type\":\"CNAME\"}")

  RECORD_ID=$(echo "${RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'])" 2>/dev/null || echo "")

  if [ -z "${RECORD_ID}" ]; then
    # Try to find any record with this name
    RESPONSE=$(curl -s -X GET "${API}" \
      -H "Authorization: Bearer ${API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data-binary "{\"name\":\"${RECORD}\"}")

    RECORD_ID=$(echo "${RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'])" 2>/dev/null || echo "")
  fi

  if [ -z "${RECORD_ID}" ]; then
    echo "  No existing record found for ${RECORD} — creating new A record"
    curl -s -X POST "${API}" \
      -H "Authorization: Bearer ${API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data-binary "{\"type\":\"A\",\"name\":\"${RECORD}\",\"content\":\"${UPLOAD_IP}\",\"ttl\":1,\"proxied\":true}" | python3 -m json.tool
  else
    # Delete existing record(s)
    echo "  Deleting existing record(s) for ${RECORD} (ID: ${RECORD_ID})"
    curl -s -X DELETE "${API}/${RECORD_ID}" \
      -H "Authorization: Bearer ${API_TOKEN}" \
      -H "Content-Type: application/json" > /dev/null

    # Create new A record
    echo "  Creating A record for ${RECORD} → ${UPLOAD_IP}"
    curl -s -X POST "${API}" \
      -H "Authorization: Bearer ${API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data-binary "{\"type\":\"A\",\"name\":\"${RECORD}\",\"content\":\"${UPLOAD_IP}\",\"ttl\":1,\"proxied\":true}" | python3 -m json.tool
  fi

  echo ""
done

echo "=== DNS update complete ==="
echo "Verify at: https://dash.cloudflare.com/?account=${ZONE_ID}#dns-records"