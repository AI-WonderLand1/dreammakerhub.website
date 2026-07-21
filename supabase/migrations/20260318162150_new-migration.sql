-- Extensions tables for secure extension storage and execution

CREATE TABLE IF NOT EXISTS public.extensions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  encrypted_code text NOT NULL,
  iv text NOT NULL,
  tag text NOT NULL,
  version text DEFAULT '1.0.0',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.extension_storage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  extension_id uuid NOT NULL REFERENCES public.extensions(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(extension_id, key)
);

CREATE INDEX IF NOT EXISTS extension_storage_extension_id_idx ON public.extension_storage(extension_id);

ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extensions_select_own" ON public.extensions;
CREATE POLICY "extensions_select_own"
  ON public.extensions
  FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "extensions_insert_authenticated" ON public.extensions;
CREATE POLICY "extensions_insert_authenticated"
  ON public.extensions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "extension_storage_select_own" ON public.extension_storage;
CREATE POLICY "extension_storage_select_own"
  ON public.extension_storage
  FOR SELECT
  USING (
    extension_id IN (SELECT id FROM public.extensions WHERE created_by = auth.uid())
  );

DROP POLICY IF EXISTS "extension_storage_insert_own" ON public.extension_storage;
CREATE POLICY "extension_storage_insert_own"
  ON public.extension_storage
  FOR INSERT
  WITH CHECK (
    extension_id IN (SELECT id FROM public.extensions WHERE created_by = auth.uid())
  );

DROP POLICY IF EXISTS "extension_storage_update_own" ON public.extension_storage;
CREATE POLICY "extension_storage_update_own"
  ON public.extension_storage
  FOR UPDATE
  USING (
    extension_id IN (SELECT id FROM public.extensions WHERE created_by = auth.uid())
  );
