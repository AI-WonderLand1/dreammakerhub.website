-- Atomic, owner-scoped file and folder renames. Keep this migration paired
-- with storage.ts: the application must not revert to copy-then-delete.
CREATE OR REPLACE FUNCTION public.rename_builder_project_path(
  p_project_id text,
  p_old_path text,
  p_new_path text
) RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_moved integer := 0;
BEGIN
  -- Never trust path validation in the browser or API alone.
  IF p_old_path IS NULL OR p_new_path IS NULL
     OR length(p_old_path) NOT BETWEEN 1 AND 512
     OR length(p_new_path) NOT BETWEEN 1 AND 512
     OR left(p_old_path, 1) = '/' OR left(p_new_path, 1) = '/'
     OR strpos(p_old_path, chr(92)) > 0 OR strpos(p_new_path, chr(92)) > 0
     OR p_old_path ~ '[[:cntrl:]]' OR p_new_path ~ '[[:cntrl:]]'
     OR (string_to_array(p_old_path, '/') && ARRAY['', '.', '..'])
     OR (string_to_array(p_new_path, '/') && ARRAY['', '.', '..'])
  THEN
    RAISE EXCEPTION 'Invalid project file path';
  END IF;

  IF p_old_path = p_new_path OR left(p_new_path, length(p_old_path) + 1) = p_old_path || '/' THEN
    RAISE EXCEPTION 'Cannot rename a path inside itself';
  END IF;

  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Serialize competing renames per owned project without elevated privileges.
  PERFORM 1 FROM public._projects
   WHERE id = p_project_id AND owner_id = (SELECT auth.uid())::text
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found or forbidden';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public._project_files
     WHERE project_id = p_project_id
       AND (file_path = p_old_path OR left(file_path, length(p_old_path) + 1) = p_old_path || '/')
  ) THEN
    RAISE EXCEPTION 'Project rename source missing';
  END IF;

  -- No merging folder trees, overwriting an existing file, or replacing a file
  -- with a directory. The PK also aborts the entire transaction on a racing
  -- direct write instead of silently overwriting data.
  IF EXISTS (
    SELECT 1 FROM public._project_files existing
    WHERE existing.project_id = p_project_id
      AND NOT (existing.file_path = p_old_path
            OR left(existing.file_path, length(p_old_path) + 1) = p_old_path || '/')
      AND (
        existing.file_path = p_new_path
        OR left(existing.file_path, length(p_new_path) + 1) = p_new_path || '/'
        OR left(p_new_path, length(existing.file_path) + 1) = existing.file_path || '/'
      )
  ) THEN
    RAISE EXCEPTION 'Project rename destination already exists';
  END IF;

  UPDATE public._project_files
     SET file_path = p_new_path || substring(file_path FROM length(p_old_path) + 1),
         updated_at = statement_timestamp()
   WHERE project_id = p_project_id
     AND (file_path = p_old_path OR left(file_path, length(p_old_path) + 1) = p_old_path || '/');
  GET DIAGNOSTICS v_moved = ROW_COUNT;

  UPDATE public._projects SET updated_at = statement_timestamp()
   WHERE id = p_project_id AND owner_id = (SELECT auth.uid())::text;

  RETURN v_moved;
END;
$$;

REVOKE ALL ON FUNCTION public.rename_builder_project_path(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rename_builder_project_path(text, text, text) TO authenticated;
