-- Machine profiles are metered like AI model tiers: bigger machines burn
-- the same monthly compute pool faster. One compute credit = one CPU-minute.

ALTER TABLE public.coder_customer_jobs
  DROP CONSTRAINT IF EXISTS coder_customer_jobs_cpu_check,
  DROP CONSTRAINT IF EXISTS coder_customer_jobs_memory_gib_check;

ALTER TABLE public.coder_customer_jobs
  ADD COLUMN IF NOT EXISTS machine_profile text NOT NULL DEFAULT 'micro',
  ADD COLUMN IF NOT EXISTS compute_multiplier integer NOT NULL DEFAULT 1;

ALTER TABLE public.coder_customer_compute_usage
  ADD COLUMN IF NOT EXISTS compute_multiplier integer NOT NULL DEFAULT 1
    CHECK (compute_multiplier IN (1,2,4,8));

-- Backfill any already-queued pilot rows before enforcing the profile shape.
UPDATE public.coder_customer_jobs
SET
  machine_profile = CASE
    WHEN cpu = 2 AND memory_gib = 4 THEN 'standard'
    ELSE 'micro'
  END,
  compute_multiplier = CASE
    WHEN cpu = 2 AND memory_gib = 4 THEN 2
    ELSE 1
  END;

UPDATE public.coder_customer_compute_usage u
SET compute_multiplier = j.compute_multiplier
FROM public.coder_customer_jobs j
WHERE j.slot_id = u.slot_id;

ALTER TABLE public.coder_customer_jobs
  ADD CONSTRAINT coder_customer_jobs_machine_profile_check
    CHECK (machine_profile IN ('micro','standard','power','max')),
  ADD CONSTRAINT coder_customer_jobs_compute_multiplier_check
    CHECK (compute_multiplier IN (1,2,4,8)),
  ADD CONSTRAINT coder_customer_jobs_cpu_check
    CHECK (cpu BETWEEN 1 AND 8),
  ADD CONSTRAINT coder_customer_jobs_memory_gib_check
    CHECK (memory_gib BETWEEN 2 AND 16),
  ADD CONSTRAINT coder_customer_jobs_profile_shape_check
    CHECK (
      (machine_profile = 'micro'    AND cpu = 1 AND memory_gib = 2  AND compute_multiplier = 1) OR
      (machine_profile = 'standard' AND cpu = 2 AND memory_gib = 4  AND compute_multiplier = 2) OR
      (machine_profile = 'power'    AND cpu = 4 AND memory_gib = 8  AND compute_multiplier = 4) OR
      (machine_profile = 'max'      AND cpu = 8 AND memory_gib = 16 AND compute_multiplier = 8)
    );

CREATE OR REPLACE FUNCTION public.meter_coder_customer_compute(
  p_slot_id uuid, p_running boolean
) RETURNS TABLE (used_ms bigint, max_ms bigint, should_stop boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_row public.coder_customer_compute_usage%ROWTYPE;
DECLARE v_now timestamptz := clock_timestamp();
DECLARE v_elapsed bigint;
DECLARE v_weighted bigint;
BEGIN
  IF p_slot_id IS NULL OR p_running IS NULL THEN RAISE EXCEPTION 'Invalid metering sample'; END IF;

  SELECT * INTO v_row
    FROM public.coder_customer_compute_usage
   WHERE slot_id = p_slot_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Unregistered customer workspace'; END IF;
  IF v_row.compute_multiplier NOT IN (1,2,4,8) THEN
    RAISE EXCEPTION 'Invalid compute multiplier';
  END IF;

  v_elapsed := GREATEST(
    0,
    floor(extract(epoch FROM (v_now - v_row.last_checked_at)) * 1000)::bigint
  );
  v_weighted := CASE WHEN p_running THEN v_elapsed * v_row.compute_multiplier ELSE 0 END;

  UPDATE public.coder_customer_compute_usage u
     SET used_ms = v_row.used_ms + v_weighted,
         last_checked_at = v_now,
         updated_at = v_now
   WHERE u.slot_id = p_slot_id
   RETURNING u.used_ms, u.max_ms INTO used_ms, max_ms;

  should_stop := used_ms >= max_ms;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.meter_coder_customer_compute(uuid, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.meter_coder_customer_compute(uuid, boolean)
  TO service_role;


-- Shared monthly pool across every workspace owned by the same DreamMakerHub user.
CREATE TABLE IF NOT EXISTS public.coder_customer_compute_monthly (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  used_weighted_ms bigint NOT NULL DEFAULT 0 CHECK (used_weighted_ms >= 0),
  limit_credits integer NOT NULL CHECK (limit_credits > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_start)
);

ALTER TABLE public.coder_customer_compute_monthly ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coder_customer_compute_monthly FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.coder_customer_compute_monthly TO service_role;

CREATE OR REPLACE FUNCTION public.meter_coder_customer_compute_v2(
  p_slot_id uuid,
  p_running boolean,
  p_monthly_limit_credits integer
) RETURNS TABLE (
  used_ms bigint,
  max_ms bigint,
  monthly_used_credits bigint,
  monthly_limit_credits integer,
  should_stop boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_row public.coder_customer_compute_usage%ROWTYPE;
DECLARE v_month public.coder_customer_compute_monthly%ROWTYPE;
DECLARE v_now timestamptz := clock_timestamp();
DECLARE v_month_start date := date_trunc('month', v_now AT TIME ZONE 'UTC')::date;
DECLARE v_elapsed bigint;
DECLARE v_weighted bigint;
BEGIN
  IF p_slot_id IS NULL OR p_running IS NULL
     OR p_monthly_limit_credits IS NULL OR p_monthly_limit_credits < 1
     OR p_monthly_limit_credits > 10000000 THEN
    RAISE EXCEPTION 'Invalid metering sample';
  END IF;

  SELECT * INTO v_row
    FROM public.coder_customer_compute_usage
   WHERE slot_id = p_slot_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unregistered customer workspace'; END IF;
  IF v_row.compute_multiplier NOT IN (1,2,4,8) THEN
    RAISE EXCEPTION 'Invalid compute multiplier';
  END IF;

  INSERT INTO public.coder_customer_compute_monthly(
    user_id, period_start, used_weighted_ms, limit_credits
  ) VALUES (
    v_row.user_id, v_month_start, 0, p_monthly_limit_credits
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET limit_credits = EXCLUDED.limit_credits, updated_at = v_now;

  SELECT * INTO v_month
    FROM public.coder_customer_compute_monthly
   WHERE user_id = v_row.user_id AND period_start = v_month_start
   FOR UPDATE;

  v_elapsed := GREATEST(
    0,
    floor(extract(epoch FROM (v_now - v_row.last_checked_at)) * 1000)::bigint
  );
  v_weighted := CASE WHEN p_running THEN v_elapsed * v_row.compute_multiplier ELSE 0 END;

  UPDATE public.coder_customer_compute_usage u
     SET used_ms = v_row.used_ms + v_weighted,
         last_checked_at = v_now,
         updated_at = v_now
   WHERE u.slot_id = p_slot_id
   RETURNING u.used_ms, u.max_ms INTO used_ms, max_ms;

  UPDATE public.coder_customer_compute_monthly m
     SET used_weighted_ms = v_month.used_weighted_ms + v_weighted,
         limit_credits = p_monthly_limit_credits,
         updated_at = v_now
   WHERE m.user_id = v_row.user_id AND m.period_start = v_month_start
   RETURNING ceil(m.used_weighted_ms / 60000.0)::bigint, m.limit_credits
     INTO monthly_used_credits, monthly_limit_credits;

  should_stop := used_ms >= max_ms OR monthly_used_credits >= monthly_limit_credits;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.meter_coder_customer_compute_v2(uuid, boolean, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.meter_coder_customer_compute_v2(uuid, boolean, integer)
  TO service_role;


-- Add weighted WonderSpace compute to the authenticated usage dashboard while
-- preserving existing generic compute_credits_used from usage_logs.
CREATE OR REPLACE FUNCTION public.get_usage_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  p RECORD;
  period_start TIMESTAMPTZ;
  month_start DATE := date_trunc('month', now() AT TIME ZONE 'UTC')::date;
  result JSON;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO p FROM public.user_profiles WHERE id = uid;
  period_start := CASE
    WHEN FOUND THEN COALESCE(p.usage_period_start, date_trunc('month', now()))
    ELSE date_trunc('month', now())
  END;

  SELECT json_build_object(
    'plan', COALESCE(p.subscription_plan, 'free'),
    'period_start', period_start,
    'period_reset', COALESCE(p.usage_period_start, date_trunc('month', now())) + interval '1 month',
    'api_calls_used', COALESCE((
      SELECT SUM(api_calls) FROM public.usage_logs
      WHERE user_id = uid AND created_at >= period_start
    ), 0),
    'tokens_used', COALESCE((
      SELECT SUM(tokens_used) FROM public.usage_logs
      WHERE user_id = uid AND created_at >= period_start
    ), 0),
    'compute_credits_used', COALESCE((
      SELECT SUM(compute_credits_used) FROM public.usage_logs
      WHERE user_id = uid AND created_at >= period_start
    ), 0),
    'ide_compute_credits_used', COALESCE((
      SELECT ceil(used_weighted_ms / 60000.0)::bigint
      FROM public.coder_customer_compute_monthly
      WHERE user_id = uid AND period_start = month_start
    ), 0),
    'runtime_minutes', COALESCE((
      SELECT SUM(runtime_minutes) FROM public.usage_logs
      WHERE user_id = uid AND created_at >= period_start
    ), 0),
    'projects_count', (
      SELECT COUNT(*) FROM public.projects
      WHERE owner_id = uid AND status <> 'deleted'
    ),
    'storage_used', COALESCE((
      SELECT SUM(storage_used) FROM public.projects
      WHERE owner_id = uid AND status <> 'deleted'
    ), 0),
    'recent_activity', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT action, tokens_used, compute_credits_used, api_calls, runtime_minutes, project_id, created_at
        FROM public.usage_logs
        WHERE user_id = uid
        ORDER BY created_at DESC
        LIMIT 12
      ) t
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END $$;

GRANT EXECUTE ON FUNCTION public.get_usage_summary() TO authenticated;
