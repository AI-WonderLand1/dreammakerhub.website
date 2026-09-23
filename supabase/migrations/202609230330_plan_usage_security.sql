-- Align canonical plan limits with the usage-first WonderSpace model and
-- prevent browser clients from editing their own billing entitlements.

ALTER TABLE public.user_profiles
  ALTER COLUMN storage_limit SET DEFAULT 5368709120,
  ALTER COLUMN projects_limit SET DEFAULT 5,
  ALTER COLUMN workspaces_limit SET DEFAULT 5,
  ALTER COLUMN ide_sessions_limit SET DEFAULT 2,
  ALTER COLUMN compute_credits_monthly SET DEFAULT 9000,
  ALTER COLUMN ai_tokens_monthly SET DEFAULT 500000,
  ALTER COLUMN runtime_hours_monthly SET DEFAULT 150,
  ALTER COLUMN api_calls_monthly SET DEFAULT 10000;

UPDATE public.user_profiles
SET
  storage_limit = CASE subscription_plan
    WHEN 'free' THEN 5368709120
    WHEN 'pro' THEN 107374182400
    WHEN 'team' THEN 536870912000
    ELSE 549755813888
  END,
  projects_limit = CASE subscription_plan
    WHEN 'free' THEN 5
    WHEN 'pro' THEN 100
    ELSE 999999
  END,
  workspaces_limit = CASE subscription_plan
    WHEN 'free' THEN 5
    WHEN 'pro' THEN 100
    ELSE 999999
  END,
  ide_sessions_limit = CASE subscription_plan
    WHEN 'free' THEN 2
    WHEN 'pro' THEN 4
    WHEN 'team' THEN 8
    ELSE 999999
  END,
  compute_credits_monthly = CASE subscription_plan
    WHEN 'free' THEN 9000
    WHEN 'pro' THEN 18000
    WHEN 'team' THEN 60000
    ELSE 999999999
  END,
  ai_tokens_monthly = CASE subscription_plan
    WHEN 'free' THEN 500000
    WHEN 'pro' THEN 5000000
    WHEN 'team' THEN 25000000
    ELSE 999999999
  END,
  runtime_hours_monthly = CASE subscription_plan
    WHEN 'free' THEN 150
    WHEN 'pro' THEN 300
    WHEN 'team' THEN 1000
    ELSE 999999
  END,
  api_calls_monthly = CASE subscription_plan
    WHEN 'free' THEN 10000
    WHEN 'pro' THEN 100000
    WHEN 'team' THEN 1000000
    ELSE 999999999
  END,
  updated_at = now();

-- A browser user may edit profile display data, never plan/limit/usage columns.
REVOKE UPDATE ON TABLE public.user_profiles FROM authenticated;
GRANT UPDATE (full_name) ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;

-- Customer Coder owners are distinct, so an unreleased workspace name only
-- needs to be unique within one DreamMakerHub account.
DROP INDEX IF EXISTS public.coder_workspace_slots_unreleased_name;
CREATE UNIQUE INDEX IF NOT EXISTS coder_workspace_slots_unreleased_user_name
  ON public.coder_workspace_slots(user_id, workspace_name)
  WHERE released_at IS NULL;

CREATE OR REPLACE FUNCTION public.reserve_coder_workspace_slot(
  p_user_id uuid, p_workspace_name text, p_origin text, p_limit integer
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_slot uuid;
BEGIN
  IF p_user_id IS NULL OR p_workspace_name IS NULL
     OR p_workspace_name !~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'
     OR p_origin IS NULL OR p_origin !~ '^https?://[^/]+$' OR length(p_origin) > 255
     OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 999999 THEN
    RETURN NULL;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  IF (SELECT count(*) FROM public.coder_workspace_slots
      WHERE user_id = p_user_id AND released_at IS NULL) >= p_limit THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.coder_workspace_slots
    WHERE user_id = p_user_id
      AND workspace_name = p_workspace_name
      AND released_at IS NULL
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.coder_workspace_slots(user_id, workspace_name, coder_api_origin)
    VALUES (p_user_id, p_workspace_name, p_origin)
    RETURNING id INTO v_slot;
  RETURN v_slot;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_coder_workspace_slot(uuid, text, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_coder_workspace_slot(uuid, text, text, integer)
  TO service_role;
