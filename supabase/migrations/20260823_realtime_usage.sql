-- Realtime usage broadcasting + aggregated usage summary
-- 1) Stream usage_logs / user_profiles changes over Supabase Realtime
--    (private: postgres_changes are filtered by RLS, so users only receive their own events)
-- 2) get_usage_summary(): one-round-trip aggregate for the billing page

-- 1. Full row payloads so UPDATE/DELETE events carry the filter columns
ALTER TABLE public.usage_logs REPLICA IDENTITY FULL;
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;

-- 2. Add tables to the realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'usage_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
  END IF;
END $$;

-- 3. Composite index for period aggregation + recent activity feed
CREATE INDEX IF NOT EXISTS usage_logs_user_created_idx ON public.usage_logs(user_id, created_at DESC);

-- 4. Aggregated usage summary for the current billing period
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

  IF FOUND THEN
    period_start := COALESCE(p.usage_period_start, date_trunc('month', now()));
  ELSE
    period_start := date_trunc('month', now());
  END IF;

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
