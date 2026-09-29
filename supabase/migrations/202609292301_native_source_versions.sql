-- WonderSpace owner-only version checkpoints. These are immutable portable source
-- snapshots, not Git objects or Git protocol hosting. No new service is needed.
-- The current editor's _project_files remains the single working tree.
CREATE TABLE IF NOT EXISTS public._project_source_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES public._projects(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  version_number INT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  snapshot JSONB NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_source_versions_project
  ON public._project_source_versions(project_id, version_number DESC);

ALTER TABLE public._project_source_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their source versions"
ON public._project_source_versions FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public._projects project
    WHERE project.id = project_id AND project.owner_id = auth.uid()::text
  )
);

-- Clients can READ their own versions but cannot insert unbounded or forged
-- snapshots directly. The tightly scoped RPC is the only creation path.
REVOKE ALL ON public._project_source_versions FROM anon, authenticated;
GRANT SELECT ON public._project_source_versions TO authenticated;

-- PostgreSQL captures a consistent file tree within one query/transaction,
-- assigns the next version under a project-scoped lock, and refuses excess
-- storage rather than silently deleting customer history.
CREATE OR REPLACE FUNCTION public.capture_project_source_version(
  p_project_id TEXT,
  p_title TEXT DEFAULT 'Checkpoint'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor TEXT := auth.uid()::text;
  clean_title TEXT := btrim(COALESCE(p_title, 'Checkpoint'));
  file_count INT;
  bytes BIGINT;
  largest_file INT;
  files JSONB;
  next_version INT;
  created public._project_source_versions%ROWTYPE;
BEGIN
  IF actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM public._projects
    WHERE id = p_project_id AND owner_id = actor
  ) THEN
    RAISE EXCEPTION 'SOURCE_PROJECT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF char_length(clean_title) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'SOURCE_INVALID_TITLE' USING ERRCODE = 'P0001';
  END IF;

  -- Serialize only version creation for this project, not every editor save.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_project_id, 783221));

  IF (
    SELECT count(*) FROM public._project_source_versions
    WHERE project_id = p_project_id AND owner_id = actor
  ) >= 50 THEN
    RAISE EXCEPTION 'SOURCE_HISTORY_LIMIT' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::integer,
         COALESCE(sum(octet_length(COALESCE(content, ''))), 0),
         COALESCE(max(octet_length(COALESCE(content, ''))), 0),
         COALESCE(jsonb_object_agg(file_path, COALESCE(content, '')), '{}'::jsonb)
  INTO file_count, bytes, largest_file, files
  FROM public._project_files
  WHERE project_id = p_project_id
    AND file_path <> '.wonderspace'
    AND file_path NOT LIKE '.wonderspace/%';

  -- Initial text-only rollout: limit storage and avoid binary or enormous
  -- imports until native blob storage and cost accounting have been tested.
  IF file_count > 200 OR bytes > 1048576 OR largest_file > 262144 THEN
    RAISE EXCEPTION 'SOURCE_CHECKPOINT_TOO_LARGE' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(max(version_number), 0) + 1 INTO next_version
  FROM public._project_source_versions
  WHERE project_id = p_project_id AND owner_id = actor;

  INSERT INTO public._project_source_versions
    (project_id, owner_id, title, snapshot, version_number)
  VALUES (p_project_id, actor, clean_title, files, next_version)
  RETURNING * INTO created;

  RETURN jsonb_build_object(
    'id', created.id,
    'title', created.title,
    'versionNumber', created.version_number,
    'createdAt', created.created_at,
    'fileCount', file_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.capture_project_source_version(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_project_source_version(TEXT, TEXT) TO authenticated;
