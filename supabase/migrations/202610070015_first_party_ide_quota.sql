-- Per-user IDE allocation quotas plus first-party project binding.
-- Quotas are allocation/resource budgets, not time limits. Deleting an
-- allocated workspace releases its credits; stopping alone keeps the website
-- allocation reserved so the persistent volume remains accounted for.

ALTER TABLE public.coder_workspace_slots
  ADD COLUMN IF NOT EXISTS quota_cost integer NOT NULL DEFAULT 10
    CHECK (quota_cost BETWEEN 1 AND 1000000);

ALTER TABLE public.coder_customer_jobs
  ADD COLUMN IF NOT EXISTS project_id text;

UPDATE public.coder_workspace_slots s
SET quota_cost = LEAST(1000000, GREATEST(1, 10 * COALESCE(j.compute_multiplier, 1)))
FROM public.coder_customer_jobs j
WHERE j.slot_id = s.id;

CREATE INDEX IF NOT EXISTS coder_workspace_slots_user_quota
  ON public.coder_workspace_slots(user_id, released_at, quota_cost);

CREATE OR REPLACE FUNCTION public.reserve_coder_workspace_slot_with_quota(
  p_user_id uuid,
  p_workspace_name text,
  p_origin text,
  p_limit integer,
  p_quota_cost integer,
  p_quota_budget integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_slot uuid;
  v_used bigint;
BEGIN
  IF p_user_id IS NULL
     OR p_workspace_name IS NULL
     OR p_workspace_name !~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'
     OR p_origin IS NULL
     OR p_origin !~ '^https?://[^/]+$'
     OR length(p_origin) > 255
     OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 999999
     OR p_quota_cost IS NULL OR p_quota_cost NOT BETWEEN 1 AND 1000000
     OR p_quota_budget IS NULL OR p_quota_budget NOT BETWEEN 1 AND 10000000 THEN
    RETURN NULL;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  IF (SELECT count(*) FROM public.coder_workspace_slots
      WHERE user_id = p_user_id AND released_at IS NULL) >= p_limit THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(sum(quota_cost), 0)
    INTO v_used
    FROM public.coder_workspace_slots
   WHERE user_id = p_user_id AND released_at IS NULL;

  IF v_used + p_quota_cost > p_quota_budget THEN
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

  INSERT INTO public.coder_workspace_slots(
    user_id, workspace_name, coder_api_origin, quota_cost
  ) VALUES (
    p_user_id, p_workspace_name, p_origin, p_quota_cost
  )
  RETURNING id INTO v_slot;

  RETURN v_slot;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_coder_workspace_slot_with_quota(
  uuid, text, text, integer, integer, integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_coder_workspace_slot_with_quota(
  uuid, text, text, integer, integer, integer
) TO service_role;
