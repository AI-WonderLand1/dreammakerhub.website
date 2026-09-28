-- Optional whole-disk customer checkpoint for faster IDE resume.
-- Each checkpoint name belongs to exactly one authenticated owner/workspace row.
-- A private, checksum-verified gzip project archive remains the portable fallback.
ALTER TABLE public.wonderspace_sandbox_workspaces
 ADD COLUMN IF NOT EXISTS last_disk_checkpoint text;
