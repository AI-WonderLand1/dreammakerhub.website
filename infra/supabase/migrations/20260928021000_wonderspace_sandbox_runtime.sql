-- Customer-only on-demand Railway Sandbox ledger. Never reused for the operator IDE.
-- Only the isolated controller's service-role identity can read or mutate rows.
CREATE TABLE IF NOT EXISTS public.wonderspace_sandbox_workspaces (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (name ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'),
 state text NOT NULL DEFAULT 'stopped' CHECK (state IN ('stopped','starting','running','saving','needs_reconciliation')),
 sandbox_id text,
 gateway_domain text,
 snapshot_path text,
 snapshot_sha256 text CHECK (snapshot_sha256 IS NULL OR snapshot_sha256 ~ '^[a-f0-9]{64}$'),
 snapshot_bytes bigint CHECK (snapshot_bytes IS NULL OR snapshot_bytes >= 0),
 snapshot_version bigint NOT NULL DEFAULT 0,
 last_autosave_at timestamptz,
 expires_at timestamptz,
 last_error_code text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT wonderspace_unique_customer_name UNIQUE(user_id,name)
);
CREATE INDEX IF NOT EXISTS wonderspace_sandbox_owner_index
 ON public.wonderspace_sandbox_workspaces(user_id,created_at);
CREATE INDEX IF NOT EXISTS wonderspace_sandbox_cleanup_index
 ON public.wonderspace_sandbox_workspaces(state,expires_at);
CREATE TABLE IF NOT EXISTS public.wonderspace_sandbox_monthly_budget (
 month_start date PRIMARY KEY,
 reserved_minutes integer NOT NULL DEFAULT 0 CHECK (reserved_minutes >= 0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wonderspace_sandbox_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wonderspace_sandbox_monthly_budget ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wonderspace_sandbox_workspaces FROM anon, authenticated;
REVOKE ALL ON public.wonderspace_sandbox_monthly_budget FROM anon, authenticated;
-- Serialize the global concurrency check and the monthly runtime reservation
-- on one ledger row. Sessions are metered conservatively at their entire
-- reserved max duration even when users stop early.
CREATE OR REPLACE FUNCTION public.reserve_wonderspace_sandbox_start(
 p_workspace_id uuid, p_user_id uuid, p_minutes integer,
 p_max_running integer, p_monthly_minutes integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
 v_month date := date_trunc('month', now() AT TIME ZONE 'UTC')::date;
 v_used integer;
 v_active integer;
 v_row public.wonderspace_sandbox_workspaces%ROWTYPE;
BEGIN
 IF p_workspace_id IS NULL OR p_user_id IS NULL OR p_minutes < 1
    OR p_minutes > 15 OR p_max_running < 1 OR p_max_running > 2
    OR p_monthly_minutes < 1 OR p_monthly_minutes > 120 THEN
   RETURN false;
 END IF;
 INSERT INTO public.wonderspace_sandbox_monthly_budget(month_start,reserved_minutes)
 VALUES (v_month,0) ON CONFLICT (month_start) DO NOTHING;
 SELECT reserved_minutes INTO v_used
 FROM public.wonderspace_sandbox_monthly_budget
 WHERE month_start = v_month FOR UPDATE;
 SELECT * INTO v_row FROM public.wonderspace_sandbox_workspaces
 WHERE id = p_workspace_id AND user_id = p_user_id FOR UPDATE;
 IF NOT FOUND OR v_row.state <> 'stopped' OR v_row.sandbox_id IS NOT NULL THEN RETURN false; END IF;
 SELECT count(*) INTO v_active FROM public.wonderspace_sandbox_workspaces
 WHERE state IN ('starting','running','saving','needs_reconciliation');
 IF v_active >= p_max_running OR v_used + p_minutes > p_monthly_minutes THEN RETURN false; END IF;
 UPDATE public.wonderspace_sandbox_monthly_budget
 SET reserved_minutes = reserved_minutes + p_minutes, updated_at = now()
 WHERE month_start = v_month;
 UPDATE public.wonderspace_sandbox_workspaces
 SET state='starting', expires_at = now() + make_interval(mins => p_minutes),
     gateway_domain=NULL, last_error_code=NULL, updated_at=now()
 WHERE id=p_workspace_id AND user_id=p_user_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reserve_wonderspace_sandbox_start(uuid,uuid,integer,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_wonderspace_sandbox_start(uuid,uuid,integer,integer,integer) TO service_role;
-- The controller still verifies the user token on every HTTP operation and
-- verifies ownership before calling this privileged DB function.
