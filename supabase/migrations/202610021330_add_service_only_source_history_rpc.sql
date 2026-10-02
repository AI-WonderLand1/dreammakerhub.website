-- Move WonderSpace source-history checkpoint creation behind the server.
-- Clients may read their own history through RLS, but may not execute a
-- SECURITY DEFINER snapshot function directly.

CREATE OR REPLACE FUNCTION public.capture_project_source_version_server(
  p_project_id TEXT,
  p_owner_id TEXT,
  p_title TEXT DEFAULT 'Checkpoint'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor TEXT := NULLIF(BTRIM(COALESCE(p_owner_id, '')), '');
  clean_title TEXT := BTRIM(COALESCE(p_title, 'Checkpoint'));
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

REVOKE ALL ON FUNCTION public.capture_project_source_version_server(TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_project_source_version_server(TEXT, TEXT, TEXT)
  TO service_role;

-- Retire direct client access to the original SECURITY DEFINER RPC. Keep the
-- function temporarily for compatibility with rollback deployments, but no
-- public role may execute it.
REVOKE ALL ON FUNCTION public.capture_project_source_version(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
