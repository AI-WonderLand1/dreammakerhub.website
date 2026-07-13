#!/usr/bin/env bash
# deploy/fix-access.sh — run ON the EC2 instance (not locally)
# Diagnoses reachability and opens the host firewall (ufw) for web traffic.
set -u

REPORT=/tmp/fix-access-report.txt
: > "$REPORT"
log() { echo "$*" | tee -a "$REPORT"; }

log "===== DreamMakerHub access diagnostics ====="
log "Date: $(date -u)"
log ""

log "--- Public IP (instance metadata) ---"
curl -fsS --max-time 8 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null | tee -a "$REPORT" || log "(metadata unavailable)"
log ""

log "--- Private IP ---"
hostname -I 2>/dev/null | tee -a "$REPORT" || true
log ""

log "--- Host firewall (ufw) status ---"
if command -v ufw >/dev/null 2>&1; then
  ufw status verbose 2>&1 | tee -a "$REPORT" || true
  log ""
  log "--- Opening web/app ports in ufw ---"
  ufw allow 22/tcp    2>&1 | tee -a "$REPORT" || true
  ufw allow 80/tcp    2>&1 | tee -a "$REPORT" || true
  ufw allow 443/tcp   2>&1 | tee -a "$REPORT" || true
  ufw allow 5000/tcp  2>&1 | tee -a "$REPORT" || true
  ufw status verbose 2>&1 | tee -a "$REPORT" || true
else
  log "ufw not installed; skipping host-firewall changes."
fi
log ""

log "--- Listening ports (ss) ---"
ss -tulnp 2>/dev/null | grep -E ':22|:80|:443|:5000' | tee -a "$REPORT" || log "(none of 22/80/443/5000 listening)"
log ""

log "--- Service status ---"
for s in nginx docker pm2; do
  printf "%-10s: " "$s"; systemctl is-active "$s" 2>/dev/null || echo "n/a"
done | tee -a "$REPORT"
log ""

log "--- Report written to $REPORT ---"
log "Paste the contents of $REPORT back to the assistant."
