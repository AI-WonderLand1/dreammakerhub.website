-- Isolated, controller-only storage for compressed customer workspace data.
ALTER TABLE public.wonderspace_sandbox_workspaces
 ADD COLUMN IF NOT EXISTS session_nonce uuid;
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('wonderspace-customer-snapshots','wonderspace-customer-snapshots',false,16777216,ARRAY['application/gzip'])
ON CONFLICT (id) DO UPDATE
 SET public=false, file_size_limit=16777216, allowed_mime_types=ARRAY['application/gzip'];
-- No client RLS policies: only the service-role controller reads or writes archives.
