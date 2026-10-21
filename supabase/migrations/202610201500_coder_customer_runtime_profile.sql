-- Add an auditable, server-approved runtime selector to existing customer IDE jobs.
-- Existing queued jobs retain their Linux environment. No customer image URL is stored.
ALTER TABLE public.coder_customer_jobs
  ADD COLUMN IF NOT EXISTS ide_image text NOT NULL DEFAULT 'linux';

ALTER TABLE public.coder_customer_jobs
  DROP CONSTRAINT IF EXISTS coder_customer_jobs_ide_image_check;
ALTER TABLE public.coder_customer_jobs
  ADD CONSTRAINT coder_customer_jobs_ide_image_check
  CHECK (ide_image IN ('linux', 'web', 'python', 'webgl'));

COMMENT ON COLUMN public.coder_customer_jobs.ide_image IS
  'Immutable customer-selected approved Linux workspace runtime profile; never a Docker image URL.';
