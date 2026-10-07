-- Safe realtime mirrors for Coder workspace state and billing counters.
-- Authoritative service-role tables remain private. Browser clients only read
-- user-scoped mirror rows through RLS.

CREATE TABLE IF NOT EXISTS public.coder_workspace_realtime (
  slot_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_name text NOT NULL,
  state text NOT NULL CHECK (state IN ('reserved','provisioned','deleting','released')),
  quota_cost integer NOT NULL DEFAULT 10 CHECK (quota_cost BETWEEN 1 AND 1000000),
  released_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coder_workspace_realtime ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coder_workspace_realtime FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Users read own Coder realtime state" ON public.coder_workspace_realtime;
CREATE POLICY "Users read own Coder realtime state"
  ON public.coder_workspace_realtime
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
GRANT SELECT ON public.coder_workspace_realtime TO authenticated;
GRANT ALL ON public.coder_workspace_realtime TO service_role;

CREATE OR REPLACE FUNCTION public.sync_coder_workspace_realtime()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.coder_workspace_realtime WHERE slot_id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.coder_workspace_realtime(
    slot_id, user_id, workspace_name, state, quota_cost, released_at, updated_at
  )
  VALUES (
    NEW.id, NEW.user_id, NEW.workspace_name, NEW.state,
    COALESCE(NEW.quota_cost, 10), NEW.released_at, NEW.updated_at
  )
  ON CONFLICT (slot_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    workspace_name = EXCLUDED.workspace_name,
    state = EXCLUDED.state,
    quota_cost = EXCLUDED.quota_cost,
    released_at = EXCLUDED.released_at,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS coder_workspace_realtime_sync ON public.coder_workspace_slots;
CREATE TRIGGER coder_workspace_realtime_sync
AFTER INSERT OR UPDATE OR DELETE ON public.coder_workspace_slots
FOR EACH ROW EXECUTE FUNCTION public.sync_coder_workspace_realtime();

INSERT INTO public.coder_workspace_realtime(
  slot_id, user_id, workspace_name, state, quota_cost, released_at, updated_at
)
SELECT id, user_id, workspace_name, state, COALESCE(quota_cost, 10), released_at, updated_at
FROM public.coder_workspace_slots
ON CONFLICT (slot_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  workspace_name = EXCLUDED.workspace_name,
  state = EXCLUDED.state,
  quota_cost = EXCLUDED.quota_cost,
  released_at = EXCLUDED.released_at,
  updated_at = EXCLUDED.updated_at;

ALTER TABLE public.coder_workspace_realtime REPLICA IDENTITY FULL;

CREATE TABLE IF NOT EXISTS public.billing_usage_realtime (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  feature text NOT NULL,
  units bigint NOT NULL DEFAULT 0 CHECK (units >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_start, feature)
);

ALTER TABLE public.billing_usage_realtime ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.billing_usage_realtime FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Users read own billing realtime usage" ON public.billing_usage_realtime;
CREATE POLICY "Users read own billing realtime usage"
  ON public.billing_usage_realtime
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
GRANT SELECT ON public.billing_usage_realtime TO authenticated;
GRANT ALL ON public.billing_usage_realtime TO service_role;

CREATE OR REPLACE FUNCTION public.sync_billing_usage_realtime()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.billing_usage_realtime
    WHERE user_id = OLD.user_id
      AND period_start = OLD.period_start
      AND feature = OLD.feature;
    RETURN OLD;
  END IF;

  INSERT INTO public.billing_usage_realtime(user_id, period_start, feature, units, updated_at)
  VALUES (NEW.user_id, NEW.period_start, NEW.feature, NEW.units, NEW.updated_at)
  ON CONFLICT (user_id, period_start, feature) DO UPDATE SET
    units = EXCLUDED.units,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billing_usage_realtime_sync ON public.billable_usage_counters;
CREATE TRIGGER billing_usage_realtime_sync
AFTER INSERT OR UPDATE OR DELETE ON public.billable_usage_counters
FOR EACH ROW EXECUTE FUNCTION public.sync_billing_usage_realtime();

INSERT INTO public.billing_usage_realtime(user_id, period_start, feature, units, updated_at)
SELECT user_id, period_start, feature, units, updated_at
FROM public.billable_usage_counters
ON CONFLICT (user_id, period_start, feature) DO UPDATE SET
  units = EXCLUDED.units,
  updated_at = EXCLUDED.updated_at;

ALTER TABLE public.billing_usage_realtime REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='coder_workspace_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coder_workspace_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='billing_usage_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.billing_usage_realtime;
  END IF;

  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.subscriptions REPLICA IDENTITY FULL';
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='subscriptions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
    END IF;
  END IF;

  IF to_regclass('public.projects') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.projects REPLICA IDENTITY FULL';
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='projects'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
    END IF;
  END IF;
END $$;
