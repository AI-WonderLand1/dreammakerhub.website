-- Jobs are never automatically retried once claimed: an HTTP timeout may
-- mean Coder created the pod even though the worker lost the response.
CREATE TABLE IF NOT EXISTS public.coder_customer_jobs (
  slot_id uuid PRIMARY KEY REFERENCES public.coder_workspace_slots(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  coder_user_id uuid NOT NULL REFERENCES public.coder_customer_identities(coder_user_id) ON DELETE RESTRICT,
  template_id uuid NOT NULL,
  cpu integer NOT NULL CHECK (cpu BETWEEN 1 AND 2),
  memory_gib integer NOT NULL CHECK (memory_gib BETWEEN 1 AND 4),
  disk_gib integer NOT NULL DEFAULT 10 CHECK (disk_gib = 10),
  max_compute_ms bigint NOT NULL CHECK (max_compute_ms BETWEEN 60000 AND 86400000),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','claimed','ready','needs_reconciliation')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coder_customer_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coder_customer_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.coder_customer_jobs TO service_role;

-- Persist consumption across pod restarts. Only the server-side controller can
-- update this table. TTL/inactivity bumps are not a cumulative compute quota.
CREATE TABLE IF NOT EXISTS public.coder_customer_compute_usage (
  slot_id uuid PRIMARY KEY REFERENCES public.coder_customer_jobs(slot_id) ON DELETE RESTRICT,
  workspace_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  used_ms bigint NOT NULL DEFAULT 0 CHECK (used_ms >= 0),
  max_ms bigint NOT NULL CHECK (max_ms BETWEEN 60000 AND 86400000),
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  stop_requested_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coder_customer_compute_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coder_customer_compute_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.coder_customer_compute_usage TO service_role;

-- Require a freshly running controller before accepting new billable pods.
CREATE TABLE IF NOT EXISTS public.coder_customer_controller (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  last_heartbeat_at timestamptz NOT NULL
);
ALTER TABLE public.coder_customer_controller ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coder_customer_controller FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.coder_customer_controller TO service_role;

-- Atomic claim across multiple workers, no re-claim after network uncertainty.
CREATE OR REPLACE FUNCTION public.claim_coder_customer_job()
RETURNS SETOF public.coder_customer_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN QUERY
  UPDATE public.coder_customer_jobs j
     SET status = 'claimed', updated_at = now()
   WHERE j.slot_id = (
     SELECT q.slot_id FROM public.coder_customer_jobs q
     WHERE q.status = 'queued' ORDER BY q.created_at
     FOR UPDATE SKIP LOCKED LIMIT 1
   )
   RETURNING j.*;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_coder_customer_job() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_coder_customer_job() TO service_role;
