-- The reservation function inserts as its DEFINER. The server-side service
-- role needs SELECT/UPDATE for verified attachment and deletion, but no direct
-- INSERT/DELETE privilege to accidentally bypass the atomic reservation path.
REVOKE ALL ON TABLE public.coder_workspace_slots FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.coder_workspace_slots TO service_role;
