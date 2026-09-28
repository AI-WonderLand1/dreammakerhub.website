-- Keep one previous integrity-checked gzip to recover from a failed latest upload.
ALTER TABLE public.wonderspace_sandbox_workspaces
 ADD COLUMN IF NOT EXISTS previous_snapshot_path text,
 ADD COLUMN IF NOT EXISTS previous_snapshot_sha256 text;
