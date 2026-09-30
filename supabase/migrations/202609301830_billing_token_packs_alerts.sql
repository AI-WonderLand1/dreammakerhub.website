-- Billing center: purchased AI token ledger + user-configurable in-app usage alerts.
-- Token grants are service-role only and idempotent by Stripe Checkout session ID.

CREATE TABLE IF NOT EXISTS public.user_token_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  purchased_tokens BIGINT NOT NULL DEFAULT 0 CHECK (purchased_tokens >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_token_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own token balance" ON public.user_token_balances;
CREATE POLICY "Users can read their own token balance"
  ON public.user_token_balances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.user_token_balances TO authenticated;
GRANT ALL ON public.user_token_balances TO service_role;

CREATE TABLE IF NOT EXISTS public.token_purchase_events (
  stripe_checkout_session_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,
  tokens BIGINT NOT NULL CHECK (tokens > 0),
  stripe_price_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS token_purchase_events_user_created_idx
  ON public.token_purchase_events(user_id, created_at DESC);

ALTER TABLE public.token_purchase_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own token purchases" ON public.token_purchase_events;
CREATE POLICY "Users can read their own token purchases"
  ON public.token_purchase_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.token_purchase_events TO authenticated;
GRANT ALL ON public.token_purchase_events TO service_role;

CREATE TABLE IF NOT EXISTS public.user_billing_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token_alert_percent INTEGER NOT NULL DEFAULT 80 CHECK (token_alert_percent BETWEEN 50 AND 100),
  api_alert_percent INTEGER NOT NULL DEFAULT 80 CHECK (api_alert_percent BETWEEN 50 AND 100),
  storage_alert_percent INTEGER NOT NULL DEFAULT 80 CHECK (storage_alert_percent BETWEEN 50 AND 100),
  in_app_alerts BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_billing_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own billing preferences" ON public.user_billing_preferences;
CREATE POLICY "Users can read their own billing preferences"
  ON public.user_billing_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.user_billing_preferences TO authenticated;
GRANT ALL ON public.user_billing_preferences TO service_role;

CREATE OR REPLACE FUNCTION public.grant_purchased_ai_tokens(
  p_user_id UUID,
  p_checkout_session_id TEXT,
  p_pack_id TEXT,
  p_tokens BIGINT,
  p_price_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_checkout_session_id IS NULL OR length(p_checkout_session_id) < 5
     OR p_pack_id IS NULL OR p_tokens <= 0 OR p_price_id IS NULL THEN
    RAISE EXCEPTION 'Invalid token grant';
  END IF;

  INSERT INTO public.token_purchase_events (
    stripe_checkout_session_id, user_id, pack_id, tokens, stripe_price_id
  )
  VALUES (
    p_checkout_session_id, p_user_id, p_pack_id, p_tokens, p_price_id
  )
  ON CONFLICT (stripe_checkout_session_id) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_token_balances (user_id, purchased_tokens, updated_at)
  VALUES (p_user_id, p_tokens, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    purchased_tokens = public.user_token_balances.purchased_tokens + EXCLUDED.purchased_tokens,
    updated_at = now();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_purchased_ai_tokens(UUID, TEXT, TEXT, BIGINT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_purchased_ai_tokens(UUID, TEXT, TEXT, BIGINT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.grant_purchased_ai_tokens(UUID, TEXT, TEXT, BIGINT, TEXT) TO service_role;
