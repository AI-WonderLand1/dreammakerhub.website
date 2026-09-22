-- Immutable one-to-one binding created ONLY by the server after both identities
-- have been verified against the SAME Supabase OIDC issuer. No client access.
CREATE TABLE IF NOT EXISTS public.coder_customer_identities (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  coder_user_id uuid NOT NULL UNIQUE,
  verified_email text NOT NULL CHECK (verified_email = lower(verified_email) AND length(verified_email) BETWEEN 3 AND 320),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coder_customer_identities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coder_customer_identities FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.coder_customer_identities TO service_role;
