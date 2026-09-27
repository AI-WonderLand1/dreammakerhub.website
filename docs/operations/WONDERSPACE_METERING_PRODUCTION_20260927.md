# Customer metering production rollout (2026-09-27)

Production DreamMakerHub Supabase was inspected BEFORE this change:
- Existing customer identity and job tables were present but empty.
- The newer weighted monthly metering RPC `meter_coder_customer_compute_v2` was absent.
- The existing controller had no heartbeat.
- Production `projects` and other dashboard schema differ from the legacy `get_usage_summary` replacement bundled into the older, uninstalled `202609230500_coder_machine_profiles.sql`.

The narrowly scoped migration `20260927120517_coder_customer_metering_core_20260927.sql` contains the machine-profile columns/checks, monthly customer compute ledger, weighted v2 RPC, function execution restrictions and service-role permissions **without** replacing unrelated dashboard functions.

The SQL in this branch was applied through the Supabase migration API as `coder_customer_metering_core_20260927` on 2026-09-27; Supabase migration history records it as version `20260927120517`. After application, read-only checks showed the RPC and monthly table exist. No customer jobs or identities were created and controller heartbeat was still null.

**The original `202609230500_coder_machine_profiles.sql` was replaced with a documented no-op** to prevent a pending historical draft from overwriting incompatible dashboard SQL or duplicating schema. The audited replacement uses the EXACT production-applied version `20260927120517`. Do not manually replay the prior draft. Do not infer that weighted metering is an independent hard compute stop: the controller and an independently enforced fail-safe must be verified before public provisioning.

## Safe verification SQL

```sql
SELECT
  EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='meter_coder_customer_compute_v2'
  ) AS metering_v2_installed,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='coder_customer_compute_monthly'
  ) AS monthly_table_installed,
  (SELECT COUNT(*) FROM public.coder_customer_identities) AS customer_identities,
  (SELECT COUNT(*) FROM public.coder_customer_jobs) AS customer_jobs,
  (SELECT MAX(last_heartbeat_at) FROM public.coder_customer_controller) AS controller_heartbeat;
```

Remaining release gates: verified Supabase-Coder customer OIDC for two independent accounts; published digest-pinned non-operator customer template and one controlled smoke pod; isolated pod/PVC storage; dedicated customer provisioner identity cutover; controller and runner with independent compute cutoff and no out-of-band restart; securely authenticated and tested per-user browser IDE gateway. Keep all customer-provisioning release flags disabled pending verification.
