-- A Stripe customer may have multiple historical subscription rows. Keep
-- subscription IDs unique while allowing customer reuse during paid checkout.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_stripe_customer_id_key;
DROP INDEX IF EXISTS public.subscriptions_stripe_customer_id_key;
CREATE INDEX IF NOT EXISTS subscriptions_customer_lookup_idx ON public.subscriptions(stripe_customer_id);

-- Resolve memberships from verified subscription rows and the one-time trial,
-- never from stale profile labels or browser-controlled metadata.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_status TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.resolve_account_membership(p_user_id UUID)
RETURNS TABLE(plan TEXT, membership_status TEXT, trial_expires_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  WITH paid AS (
    SELECT s.plan FROM public.subscriptions s
    WHERE s.user_id=p_user_id AND s.status IN ('active','trialing')
      AND s.stripe_subscription_id LIKE 'sub\_%' ESCAPE '\'
      AND s.plan IN ('creator','pro','studio','team','enterprise')
    ORDER BY CASE s.plan WHEN 'enterprise' THEN 5 WHEN 'team' THEN 4
      WHEN 'studio' THEN 3 WHEN 'pro' THEN 2 WHEN 'creator' THEN 1 END DESC
    LIMIT 1
  ), trial AS (SELECT * FROM public.account_trials WHERE user_id=p_user_id)
  SELECT COALESCE((SELECT p.plan FROM paid p),
    CASE WHEN t.started_at<=now() AND t.expires_at>now() THEN 'trial' ELSE 'free' END),
    CASE WHEN EXISTS(SELECT 1 FROM paid) THEN 'active'
      WHEN t.started_at<=now() AND t.expires_at>now() THEN 'trial'
      WHEN t.expires_at<=now() THEN 'expired' ELSE 'inactive' END,
    t.expires_at
  FROM (SELECT 1) seed LEFT JOIN trial t ON true;
$$;
REVOKE ALL ON FUNCTION public.resolve_account_membership(UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_account_membership(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.refresh_account_membership(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE membership RECORD; customer TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  SELECT * INTO membership FROM public.resolve_account_membership(p_user_id);
  SELECT s.stripe_customer_id INTO customer FROM public.subscriptions s
    WHERE s.user_id=p_user_id AND s.stripe_customer_id IS NOT NULL
    ORDER BY s.updated_at DESC NULLS LAST LIMIT 1;
  INSERT INTO public.profiles(id,subscription_tier,membership_status,trial_expires_at,stripe_customer_id,updated_at)
    VALUES(p_user_id,membership.plan,membership.membership_status,membership.trial_expires_at,customer,now())
    ON CONFLICT(id) DO UPDATE SET subscription_tier=EXCLUDED.subscription_tier,
      membership_status=EXCLUDED.membership_status, trial_expires_at=EXCLUDED.trial_expires_at,
      stripe_customer_id=COALESCE(EXCLUDED.stripe_customer_id,profiles.stripe_customer_id), updated_at=now();
  UPDATE auth.users SET raw_app_meta_data=COALESCE(raw_app_meta_data,'{}'::jsonb)||jsonb_build_object(
    'plan',membership.plan,'membership_status',membership.membership_status,'trial_expires_at',membership.trial_expires_at)
    WHERE id=p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_account_membership(UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_account_membership(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.sync_account_membership_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF TG_OP='DELETE' THEN
    -- A cascading auth-user deletion must not recreate a removed profile.
    IF EXISTS(SELECT 1 FROM auth.users WHERE id=OLD.user_id) THEN
      PERFORM public.refresh_account_membership(OLD.user_id);
    END IF;
    RETURN OLD;
  END IF;
  PERFORM public.refresh_account_membership(NEW.user_id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_account_membership_trigger() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS sync_account_membership ON public.account_trials;
CREATE TRIGGER sync_account_membership AFTER INSERT OR UPDATE OR DELETE ON public.account_trials
  FOR EACH ROW EXECUTE FUNCTION public.sync_account_membership_trigger();
DROP TRIGGER IF EXISTS sync_account_membership ON public.subscriptions;
CREATE TRIGGER sync_account_membership AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_account_membership_trigger();

-- An authenticated caller can read only their own current state. Resolving at
-- request time accounts for expiry even when no new webhook/database write occurs.
CREATE OR REPLACE FUNCTION public.get_account_membership()
RETURNS TABLE(plan TEXT,membership_status TEXT,trial_expires_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT * FROM public.resolve_account_membership(auth.uid()) WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.get_account_membership() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_account_membership() TO authenticated;

-- Replace the older one-project free quota trigger, which would otherwise
-- override trial and current paid plan limits even with the new trial guard.
CREATE OR REPLACE FUNCTION public.enforce_builder_project_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE membership RECORD; allowed_projects INTEGER;
BEGIN
  IF NEW.owner_id IS NULL OR NEW.owner_id !~ '^[0-9a-fA-F-]{36}$' THEN
    RAISE EXCEPTION 'PROJECT_OWNER_INVALID';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.owner_id,0));
  SELECT * INTO membership FROM public.resolve_account_membership(NEW.owner_id::uuid);
  allowed_projects:=CASE membership.plan WHEN 'trial' THEN 5 WHEN 'creator' THEN 25
    WHEN 'pro' THEN 100 WHEN 'studio' THEN 250 WHEN 'team' THEN 999999
    WHEN 'enterprise' THEN 999999 ELSE 0 END;
  IF (SELECT count(*) FROM public._projects WHERE owner_id=NEW.owner_id)>=allowed_projects THEN
    RAISE EXCEPTION 'PROJECT_LIMIT_REACHED';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_builder_project_quota() FROM PUBLIC,anon,authenticated;

-- Refresh legacy mirrors without enrolling anyone in a trial or changing Stripe.
DO $$ DECLARE account RECORD; BEGIN
  FOR account IN SELECT id FROM public.profiles LOOP
    PERFORM public.refresh_account_membership(account.id);
  END LOOP;
END $$;
