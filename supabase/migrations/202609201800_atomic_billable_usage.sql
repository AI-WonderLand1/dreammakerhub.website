-- Apply before enabling billable endpoints. Neither a browser nor a client JWT can reserve units.
CREATE TABLE IF NOT EXISTS public.billable_usage_counters (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  feature text NOT NULL CHECK (feature IN ('ai_tokens', 'ai_requests', 'agent_requests', 'workspace_launches')),
  units bigint NOT NULL DEFAULT 0 CHECK (units >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_start, feature)
);

ALTER TABLE public.billable_usage_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.billable_usage_counters FROM PUBLIC, anon, authenticated;
-- Internal only. Do not expose counters through a browser role.
GRANT SELECT, INSERT, UPDATE ON TABLE public.billable_usage_counters TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_billable_units(
  p_user_id uuid,
  p_feature text,
  p_units integer,
  p_limit integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  reserved bigint;
  month_start date := date_trunc('month', now() AT TIME ZONE 'UTC')::date;
BEGIN
  IF p_user_id IS NULL OR p_feature NOT IN ('ai_tokens', 'ai_requests', 'agent_requests', 'workspace_launches')
     OR p_units IS NULL OR p_units < 1 OR p_units > 1000000 OR p_limit IS NULL OR p_limit < 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.billable_usage_counters (user_id, period_start, feature, units)
  VALUES (p_user_id, month_start, p_feature, 0)
  ON CONFLICT (user_id, period_start, feature) DO NOTHING;

  -- This conditional UPDATE is atomic across concurrent requests and containers.
  UPDATE public.billable_usage_counters
     SET units = units + p_units, updated_at = now()
   WHERE user_id = p_user_id AND period_start = month_start AND feature = p_feature
     AND units <= p_limit - p_units
  RETURNING units INTO reserved;
  RETURN reserved IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_billable_units(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_billable_units(uuid, text, integer, integer) TO service_role;
