\set ON_ERROR_STOP on
-- Disposable GitHub Actions database only. NEVER target production.
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
\ir ../../supabase/migrations/202609201800_atomic_billable_usage.sql

DO $test$
DECLARE
  first_user uuid := '00000000-0000-4000-8000-000000000001';
  second_user uuid := '00000000-0000-4000-8000-000000000002';
  counter_units bigint;
BEGIN
  IF NOT public.reserve_billable_units(first_user, 'ai_requests', 1, 2) THEN
    RAISE EXCEPTION 'First request should reserve';
  END IF;
  IF NOT public.reserve_billable_units(first_user, 'ai_requests', 1, 2) THEN
    RAISE EXCEPTION 'Second request should reserve';
  END IF;
  IF public.reserve_billable_units(first_user, 'ai_requests', 1, 2) THEN
    RAISE EXCEPTION 'Third request must be denied at the limit';
  END IF;
  SELECT units INTO counter_units FROM public.billable_usage_counters
    WHERE user_id = first_user AND feature = 'ai_requests';
  IF counter_units IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'Counter must stay at 2, got %', counter_units;
  END IF;
  IF NOT public.reserve_billable_units(second_user, 'ai_requests', 1, 1) THEN
    RAISE EXCEPTION 'A different user must have an independent allowance';
  END IF;
  IF NOT public.reserve_billable_units(first_user, 'ai_tokens', 100, 150) THEN
    RAISE EXCEPTION 'Token budget should reserve independently';
  END IF;
  IF public.reserve_billable_units(first_user, 'ai_tokens', 51, 150) THEN
    RAISE EXCEPTION 'Token budget must reject overage';
  END IF;
  IF public.reserve_billable_units(first_user, 'unapproved_feature', 1, 100) THEN
    RAISE EXCEPTION 'Unknown feature must not reserve';
  END IF;
  IF has_table_privilege('anon', 'public.billable_usage_counters', 'SELECT') OR
     has_table_privilege('authenticated', 'public.billable_usage_counters', 'SELECT') OR
     has_function_privilege('anon', 'public.reserve_billable_units(uuid,text,integer,integer)', 'EXECUTE') OR
     has_function_privilege('authenticated', 'public.reserve_billable_units(uuid,text,integer,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Browser roles must not access the ledger or reservation RPC';
  END IF;
  IF NOT has_table_privilege('service_role', 'public.billable_usage_counters', 'SELECT') OR
     NOT has_function_privilege('service_role', 'public.reserve_billable_units(uuid,text,integer,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Service role must have explicit access';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.billable_usage_counters'::regclass AND relrowsecurity = true
  ) THEN
    RAISE EXCEPTION 'Ledger RLS must be enabled';
  END IF;
  RAISE NOTICE 'PASS: atomic reservations, separate user/feature budgets, browser access denied, RLS enabled';
END
$test$;
