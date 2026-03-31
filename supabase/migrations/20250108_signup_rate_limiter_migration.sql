-- signup_rate_limiter_migration.sql
-- Creates signup_attempts table used by the signup_rate_limiter function.
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip text NOT NULL,
  created_at timestamptz DEFAULT now()
);
