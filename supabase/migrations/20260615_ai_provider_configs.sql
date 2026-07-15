-- AI Provider Configurations
-- Stores encrypted API keys for user-selected AI providers

CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  api_key_encrypted text,
  api_key_iv text,
  api_key_tag text,
  api_key_alg text,
  default_model text,
  base_url text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.ai_provider_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_provider_configs_select_own" ON public.ai_provider_configs;
CREATE POLICY "ai_provider_configs_select_own"
  ON public.ai_provider_configs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_provider_configs_insert_own" ON public.ai_provider_configs;
CREATE POLICY "ai_provider_configs_insert_own"
  ON public.ai_provider_configs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_provider_configs_update_own" ON public.ai_provider_configs;
CREATE POLICY "ai_provider_configs_update_own"
  ON public.ai_provider_configs
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_provider_configs_delete_own" ON public.ai_provider_configs;
CREATE POLICY "ai_provider_configs_delete_own"
  ON public.ai_provider_configs
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ai_provider_configs_user_provider_idx ON public.ai_provider_configs(user_id, provider);
CREATE INDEX IF NOT EXISTS ai_provider_configs_active_idx ON public.ai_provider_configs(user_id) WHERE is_active;