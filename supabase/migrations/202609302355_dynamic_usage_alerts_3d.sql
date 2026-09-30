-- Dynamic usage alarms + real 3D generation metering.
ALTER TABLE public.usage_logs
  ADD COLUMN IF NOT EXISTS three_d_generations BIGINT NOT NULL DEFAULT 0 CHECK (three_d_generations >= 0);

CREATE TABLE IF NOT EXISTS public.user_usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN ('ai_tokens','api_requests','storage','three_d_generations')),
  threshold_kind TEXT NOT NULL CHECK (threshold_kind IN ('percent','absolute')),
  threshold_value NUMERIC NOT NULL CHECK (threshold_value > 0),
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app']::TEXT[],
  destination_email TEXT,
  destination_phone TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_triggered_period_start TIMESTAMPTZ,
  last_triggered_value NUMERIC,
  last_delivery_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (metric = 'three_d_generations' AND threshold_kind = 'absolute')
    OR
    (metric <> 'three_d_generations' AND threshold_kind = 'percent' AND threshold_value <= 100)
  )
);

CREATE INDEX IF NOT EXISTS user_usage_alerts_user_idx
  ON public.user_usage_alerts(user_id, enabled, metric);

ALTER TABLE public.user_usage_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own usage alerts" ON public.user_usage_alerts;
CREATE POLICY "Users manage their own usage alerts"
  ON public.user_usage_alerts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_usage_alerts TO authenticated;
GRANT ALL ON public.user_usage_alerts TO service_role;

ALTER TABLE public.user_usage_alerts REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_usage_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_usage_alerts;
  END IF;
END $$;

-- Carry forward the existing three saved in-app thresholds when present.
INSERT INTO public.user_usage_alerts (
  user_id, metric, threshold_kind, threshold_value, channels, enabled
)
SELECT p.user_id, values.metric, 'percent', values.threshold, ARRAY['in_app']::TEXT[], p.in_app_alerts
FROM public.user_billing_preferences p
CROSS JOIN LATERAL (
  VALUES
    ('ai_tokens'::TEXT, p.token_alert_percent::NUMERIC),
    ('api_requests'::TEXT, p.api_alert_percent::NUMERIC),
    ('storage'::TEXT, p.storage_alert_percent::NUMERIC)
) AS values(metric, threshold)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_usage_alerts a
  WHERE a.user_id = p.user_id AND a.metric = values.metric
);

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
  result JSON;
BEGIN
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO p FROM public.user_profiles WHERE id = uid;
  period_start := COALESCE(p.usage_period_start, date_trunc('month', now()));

  SELECT json_build_object(
    'plan', COALESCE(p.subscription_plan, 'free'),
    'period_start', period_start,
    'period_reset', period_start + interval '1 month',
    'api_calls_used', COALESCE((
      SELECT SUM(api_calls) FROM public.usage_logs
      WHERE user_id = uid AND created_at >= period_start
    ), 0),
    'tokens_used', COALESCE((
      SELECT SUM(tokens_used) FROM public.usage_logs
      WHERE user_id = uid AND created_at >= period_start
    ), 0),
    'three_d_generations', COALESCE((
      SELECT SUM(three_d_generations) FROM public.usage_logs
      WHERE user_id = uid AND created_at >= period_start
    ), 0),
    'compute_credits_used', COALESCE((
      SELECT SUM(compute_credits_used) FROM public.usage_logs
      WHERE user_id = uid AND created_at >= period_start
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
        SELECT action, tokens_used, three_d_generations, compute_credits_used, api_calls, runtime_minutes, project_id, created_at
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


CREATE OR REPLACE FUNCTION public.get_usage_totals_for_alerts(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  p RECORD;
  period_start TIMESTAMPTZ;
  result JSON;
BEGIN
  SELECT * INTO p FROM public.user_profiles WHERE id = p_user_id;
  period_start := COALESCE(p.usage_period_start, date_trunc('month', now()));

  SELECT json_build_object(
    'plan', COALESCE(p.subscription_plan, 'free'),
    'period_start', period_start,
    'api_requests', COALESCE((
      SELECT SUM(api_calls) FROM public.usage_logs
      WHERE user_id = p_user_id AND created_at >= period_start
    ), 0),
    'ai_tokens', COALESCE((
      SELECT SUM(tokens_used) FROM public.usage_logs
      WHERE user_id = p_user_id AND created_at >= period_start
    ), 0),
    'three_d_generations', COALESCE((
      SELECT SUM(three_d_generations) FROM public.usage_logs
      WHERE user_id = p_user_id AND created_at >= period_start
    ), 0),
    'storage', COALESCE((
      SELECT SUM(storage_used) FROM public.projects
      WHERE owner_id = p_user_id AND status <> 'deleted'
    ), 0)
  ) INTO result;

  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.get_usage_totals_for_alerts(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_usage_totals_for_alerts(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_usage_totals_for_alerts(UUID) TO service_role;
