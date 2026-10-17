-- A free account has no renewable allowance. Trials are explicit, one-time and
-- separate from paid subscriptions; starting a trial never creates a Stripe charge.
CREATE TABLE IF NOT EXISTS public.account_trials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '14 days',
  usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (expires_at = started_at + interval '14 days')
);
ALTER TABLE public.account_trials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_trials FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.account_trials TO service_role;

CREATE OR REPLACE FUNCTION public.start_account_trial(p_user_id UUID)
RETURNS TABLE(started_at TIMESTAMPTZ, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'User required'; END IF;
  -- Never update these timestamps on conflict, including after expiry.
  INSERT INTO public.account_trials(user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  RETURN QUERY SELECT t.started_at, t.expires_at
    FROM public.account_trials t WHERE t.user_id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.start_account_trial(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_account_trial(UUID) TO service_role;

-- Retain the existing atomic paid ledger, but put all v2 callers behind the
-- trial/paid entitlement check. Re-running this migration does not replace the
-- paid implementation with the wrapper itself.
DO $$ BEGIN
  IF to_regprocedure('public.reserve_paid_billable_units_v2(uuid,text,integer,integer,text)') IS NULL THEN
    ALTER FUNCTION public.reserve_billable_units_v2(UUID,TEXT,INTEGER,INTEGER,TEXT)
      RENAME TO reserve_paid_billable_units_v2;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.reserve_paid_billable_units_v2(UUID,TEXT,INTEGER,INTEGER,TEXT)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reserve_billable_units_v2(
  p_user_id UUID, p_feature TEXT, p_units INTEGER, p_limit INTEGER, p_source TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  trial public.account_trials%ROWTYPE;
  trial_limit INTEGER;
  consumed BIGINT;
  reserved BOOLEAN;
BEGIN
  IF p_user_id IS NULL OR p_feature IS NULL OR p_source IS NULL
     OR p_units IS NULL OR p_units < 1 OR p_units > 1000000
     OR p_limit IS NULL OR p_limit < 0
     OR p_source NOT IN ('dreammakerhub','ai-playground','npc-ai-sim') THEN RETURN false; END IF;

  IF EXISTS (SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p_user_id AND s.status IN ('active','trialing')
      AND s.plan IN ('creator','pro','studio','team','enterprise')
      AND s.stripe_subscription_id LIKE 'sub\_%' ESCAPE '\') THEN
    RETURN public.reserve_paid_billable_units_v2(p_user_id,p_feature,p_units,p_limit,p_source);
  END IF;

  -- Serialize all trial features per account; caps last for the whole trial,
  -- including trials spanning a calendar-month boundary and cross-repo usage.
  SELECT * INTO trial FROM public.account_trials WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR trial.started_at > clock_timestamp() OR trial.expires_at <= clock_timestamp() THEN RETURN false; END IF;
  trial_limit := CASE p_feature
    WHEN 'ai_tokens' THEN 500000 WHEN 'render_credits' THEN 10
    WHEN 'ai_requests' THEN 10000 WHEN 'agent_requests' THEN 100
    WHEN 'workspace_launches' THEN 5 ELSE 0 END;
  consumed := COALESCE((trial.usage ->> p_feature)::bigint, 0);
  IF consumed + p_units > LEAST(trial_limit, p_limit) THEN RETURN false; END IF;

  reserved := public.reserve_paid_billable_units_v2(p_user_id,p_feature,p_units,p_limit,p_source);
  IF reserved THEN
    UPDATE public.account_trials SET usage = jsonb_set(usage, ARRAY[p_feature], to_jsonb(consumed + p_units))
      WHERE user_id = p_user_id;
  END IF;
  RETURN reserved;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_billable_units_v2(UUID,TEXT,INTEGER,INTEGER,TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_billable_units_v2(UUID,TEXT,INTEGER,INTEGER,TEXT) TO service_role;

-- Keep existing projects readable/deletable after expiry, but prevent new
-- project/file/revision writes from silently retaining permanent free access.
CREATE OR REPLACE FUNCTION public.guard_trial_project_write()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  owner TEXT;
  trial public.account_trials%ROWTYPE;
  stored BIGINT;
BEGIN
  IF TG_TABLE_NAME = '_projects' THEN owner := NEW.owner_id;
  ELSE SELECT p.owner_id INTO owner FROM public._projects p WHERE p.id = NEW.project_id;
  END IF;
  IF owner IS NULL THEN RAISE EXCEPTION 'Project owner required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(owner, 0));
  IF EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id::text = owner
    AND s.status IN ('active','trialing') AND s.plan IN ('creator','pro','studio','team','enterprise')
    AND s.stripe_subscription_id LIKE 'sub\_%' ESCAPE '\') THEN RETURN NEW; END IF;
  SELECT * INTO trial FROM public.account_trials WHERE user_id::text = owner;
  IF NOT FOUND OR trial.started_at > clock_timestamp() OR trial.expires_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'MEMBERSHIP_REQUIRED: Start a trial or choose a paid membership.' USING ERRCODE = '23514';
  END IF;
  IF TG_TABLE_NAME = '_projects' AND TG_OP = 'INSERT' THEN
    IF (SELECT count(*) FROM public._projects WHERE owner_id = owner) >= 5 THEN
      RAISE EXCEPTION 'PROJECT_LIMIT_REACHED' USING ERRCODE = '23514';
    END IF;
  ELSIF TG_TABLE_NAME = '_project_files' THEN
    SELECT COALESCE(sum(octet_length(f.content)::bigint), 0) INTO stored
      FROM public._project_files f JOIN public._projects p ON p.id = f.project_id
      WHERE p.owner_id = owner;
    IF TG_OP = 'UPDATE' THEN stored := stored - COALESCE(octet_length(OLD.content), 0); END IF;
    IF stored + COALESCE(octet_length(NEW.content), 0)::bigint > 5368709120 THEN
      RAISE EXCEPTION 'Trial storage limit reached' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_trial_project_write() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trial_membership_guard ON public._projects;
CREATE TRIGGER trial_membership_guard BEFORE INSERT OR UPDATE ON public._projects
  FOR EACH ROW EXECUTE FUNCTION public.guard_trial_project_write();
DROP TRIGGER IF EXISTS trial_membership_guard ON public._project_files;
CREATE TRIGGER trial_membership_guard BEFORE INSERT OR UPDATE ON public._project_files
  FOR EACH ROW EXECUTE FUNCTION public.guard_trial_project_write();
DROP TRIGGER IF EXISTS trial_membership_guard ON public._project_revisions;
CREATE TRIGGER trial_membership_guard BEFORE INSERT OR UPDATE ON public._project_revisions
  FOR EACH ROW EXECUTE FUNCTION public.guard_trial_project_write();

-- Some deployments never had the legacy usage-profile table.
DO $$ BEGIN
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    ALTER TABLE public.user_profiles
      ALTER COLUMN storage_limit SET DEFAULT 0, ALTER COLUMN projects_limit SET DEFAULT 0,
      ALTER COLUMN workspaces_limit SET DEFAULT 0, ALTER COLUMN ide_sessions_limit SET DEFAULT 0,
      ALTER COLUMN compute_credits_monthly SET DEFAULT 0, ALTER COLUMN ai_tokens_monthly SET DEFAULT 0,
      ALTER COLUMN runtime_hours_monthly SET DEFAULT 0, ALTER COLUMN api_calls_monthly SET DEFAULT 0;
    UPDATE public.user_profiles SET storage_limit=0, projects_limit=0, workspaces_limit=0,
      ide_sessions_limit=0, compute_credits_monthly=0, ai_tokens_monthly=0,
      runtime_hours_monthly=0, api_calls_monthly=0 WHERE subscription_plan='free';
  END IF;
END $$;
