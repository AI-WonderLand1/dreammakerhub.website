-- Enforce this at the database layer, including alternate APIs that insert into _projects.
-- This covers _projects only; legacy public.projects and external project stores need their own audit.
CREATE OR REPLACE FUNCTION public.enforce_builder_project_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  paid_plan text;
  allowed_projects integer := 1;
  existing_projects integer;
BEGIN
  IF NEW.owner_id IS NULL OR NEW.owner_id !~ '^[0-9a-fA-F-]{36}$' THEN
    RAISE EXCEPTION 'PROJECT_OWNER_INVALID' USING ERRCODE = 'P0001';
  END IF;

  -- Serialize creation for each account across app replicas and alternate endpoints.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.owner_id, 0));

  SELECT CASE
    WHEN bool_or(plan = 'team') THEN 'team'
    WHEN bool_or(plan = 'pro') THEN 'pro'
    ELSE 'free'
  END INTO paid_plan
  FROM public.subscriptions
  WHERE user_id::text = NEW.owner_id
    AND status IN ('active', 'trialing')
    AND stripe_subscription_id LIKE 'sub_%';

  allowed_projects := CASE paid_plan WHEN 'team' THEN 10 WHEN 'pro' THEN 5 ELSE 1 END;
  SELECT COUNT(*) INTO existing_projects FROM public._projects WHERE owner_id = NEW.owner_id;
  IF existing_projects >= allowed_projects THEN
    RAISE EXCEPTION 'PROJECT_LIMIT_REACHED' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_builder_project_quota_on_insert ON public._projects;
CREATE TRIGGER enforce_builder_project_quota_on_insert
BEFORE INSERT ON public._projects
FOR EACH ROW EXECUTE FUNCTION public.enforce_builder_project_quota();

REVOKE ALL ON FUNCTION public.enforce_builder_project_quota() FROM PUBLIC, anon, authenticated;
