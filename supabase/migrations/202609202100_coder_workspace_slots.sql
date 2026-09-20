-- A slot represents an allocated Coder workspace, including its persistent disk.
-- Stopping a pod does not free a slot: stopped workspace PVCs may still incur costs.
-- No automatic timeout releases: a timed-out create may have succeeded at Coder.
CREATE TABLE IF NOT EXISTS public.coder_workspace_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_name text NOT NULL CHECK (workspace_name ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'),
  coder_api_origin text NOT NULL CHECK (length(coder_api_origin) BETWEEN 8 AND 255),
  workspace_id uuid UNIQUE,
  state text NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved', 'provisioned', 'deleting', 'released')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  CONSTRAINT coder_slot_release_consistency CHECK ((state = 'released') = (released_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS coder_workspace_slots_unreleased_name
  ON public.coder_workspace_slots(workspace_name) WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS coder_workspace_slots_unreleased_user
  ON public.coder_workspace_slots(user_id) WHERE released_at IS NULL;
ALTER TABLE public.coder_workspace_slots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coder_workspace_slots FROM PUBLIC, anon, authenticated;

-- The Coder API token currently uses a shared owner. Workspaces named by that
-- owner must not collide across DreamMakerHub accounts, hence the global name index.
CREATE OR REPLACE FUNCTION public.reserve_coder_workspace_slot(
  p_user_id uuid, p_workspace_name text, p_origin text, p_limit integer
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_slot uuid;
BEGIN
  IF p_user_id IS NULL OR p_workspace_name IS NULL
     OR p_workspace_name !~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'
     OR p_origin IS NULL OR p_origin !~ '^https?://[^/]+$' OR length(p_origin) > 255
     OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 5 THEN
    RETURN NULL;
  END IF;
  -- Serialize requests across processes and web servers for the SAME user.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
  IF (SELECT count(*) FROM public.coder_workspace_slots
      WHERE user_id = p_user_id AND released_at IS NULL) >= p_limit THEN
    RETURN NULL;
  END IF;
  -- An unreleased name is reserved globally, including uncertain creations.
  IF EXISTS (SELECT 1 FROM public.coder_workspace_slots
             WHERE workspace_name = p_workspace_name AND released_at IS NULL) THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.coder_workspace_slots(user_id, workspace_name, coder_api_origin)
    VALUES (p_user_id, p_workspace_name, p_origin) RETURNING id INTO v_slot;
  RETURN v_slot;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_coder_workspace_slot(uuid, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_coder_workspace_slot(uuid, text, text, integer) TO service_role;
