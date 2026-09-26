#!/usr/bin/env bash
set -euo pipefail
# Run ONLY on the disposable GitHub Actions PostgreSQL service. Never production.
[[ "${PGHOST:-}" == 127.0.0.1 && "${PGDATABASE:-}" == launch_test ]] || {
  echo "Refusing to run outside the isolated launch_test database" >&2
  exit 1
}
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
conn=(psql -X -At -v ON_ERROR_STOP=1)
user_id='00000000-0000-4000-8000-000000000003'
# Hold the first transaction's row lock while the second connection competes.
"${conn[@]}" -c "BEGIN; SELECT public.reserve_billable_units('$user_id', 'workspace_launches', 1, 1); SELECT pg_sleep(2); COMMIT;" > "$tmp/first" &
first_pid=$!
sleep 0.6
"${conn[@]}" -c "BEGIN; SELECT public.reserve_billable_units('$user_id', 'workspace_launches', 1, 1); COMMIT;" > "$tmp/second" &
second_pid=$!
wait "$first_pid"
wait "$second_pid"
pass_count=$(cat "$tmp/first" "$tmp/second" | grep -cx 't' || true)
deny_count=$(cat "$tmp/first" "$tmp/second" | grep -cx 'f' || true)
final_units=$("${conn[@]}" -c "SELECT units FROM public.billable_usage_counters WHERE user_id='$user_id' AND feature='workspace_launches';")
if [[ "$pass_count" != 1 || "$deny_count" != 1 || "$final_units" != 1 ]]; then
  echo "FAIL: concurrent reservations exceeded quota or produced an inconsistent result" >&2
  exit 1
fi
echo "PASS: two independent concurrent transactions, one reservation, one denial, final counter=1"
