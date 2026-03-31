-- BYOC cloud connection records with encrypted credential payloads.

CREATE TABLE IF NOT EXISTS public.cloud_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('s3', 'gcs', 'azure', 'r2', 'supabase')),
  bucket_or_container text NOT NULL,
  region text,
  auth_mode text NOT NULL CHECK (auth_mode IN ('apiKey', 'oauth')),
  credentials_ciphertext text NOT NULL,
  credentials_iv text NOT NULL,
  credentials_tag text NOT NULL,
  credentials_alg text NOT NULL,
  credentials_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  connected_at timestamptz NOT NULL DEFAULT now(),
  disconnected_at timestamptz,
  last_reconnected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cloud_connections_user_id_idx ON public.cloud_connections(user_id);
CREATE INDEX IF NOT EXISTS cloud_connections_status_idx ON public.cloud_connections(status);

ALTER TABLE public.cloud_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cloud_connections_select_own" ON public.cloud_connections;
CREATE POLICY "cloud_connections_select_own"
  ON public.cloud_connections
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cloud_connections_insert_own" ON public.cloud_connections;
CREATE POLICY "cloud_connections_insert_own"
  ON public.cloud_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cloud_connections_update_own" ON public.cloud_connections;
CREATE POLICY "cloud_connections_update_own"
  ON public.cloud_connections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cloud_connections_delete_own" ON public.cloud_connections;
CREATE POLICY "cloud_connections_delete_own"
  ON public.cloud_connections
  FOR DELETE
  USING (auth.uid() = user_id);
