-- Align the existing public.pages table with the Pages API and WonderBuild publishing.
--
-- The production table observed on 2026-10-23 contained only:
--   id TEXT NOT NULL, content JSONB NOT NULL, updated_at TIMESTAMPTZ, user_id UUID.
-- The application also writes/reads title, slug, body_html, cover_image_url and published.
-- Do not recreate the table or disable its existing owner-scoped RLS policies.
--
-- Apply before deploying the WonderBuild publishing route. Existing pages remain intact.
-- The unique index deliberately fails on duplicate non-null slugs instead of
-- silently changing a customer's URL; inspect and resolve duplicates first.

BEGIN;

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS body_html TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS published BOOLEAN;

-- The Pages API does not provide an ID on INSERT, and publish uses slug upsert.
ALTER TABLE public.pages
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN title SET DEFAULT 'Untitled Page',
  ALTER COLUMN body_html SET DEFAULT '',
  ALTER COLUMN published SET DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS pages_slug_unique_idx
  ON public.pages (slug);

COMMIT;
