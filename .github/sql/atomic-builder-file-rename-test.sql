-- Disposable PostgreSQL integration tests. Never run against a live customer DB.
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE anon NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

CREATE TABLE public._projects (
  id text PRIMARY KEY, owner_id text NOT NULL, updated_at timestamptz DEFAULT now()
);
CREATE TABLE public._project_files (
  project_id text NOT NULL REFERENCES public._projects(id),
  file_path text NOT NULL,
  content text,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY(project_id, file_path)
);
ALTER TABLE public._projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_project ON public._projects TO authenticated
  USING(owner_id = auth.uid()::text) WITH CHECK(owner_id = auth.uid()::text);
CREATE POLICY own_files ON public._project_files TO authenticated
  USING(EXISTS (SELECT 1 FROM public._projects p
                WHERE p.id=project_id AND p.owner_id=auth.uid()::text))
  WITH CHECK(EXISTS (SELECT 1 FROM public._projects p
                WHERE p.id=project_id AND p.owner_id=auth.uid()::text));
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public._projects TO authenticated;
GRANT SELECT, UPDATE ON public._project_files TO authenticated;

\i supabase/migrations/202609261400_atomic_builder_file_rename.sql

INSERT INTO public._projects (id,owner_id) VALUES
('proj-a','11111111-1111-4111-8111-111111111111'),
('proj-b','22222222-2222-4222-8222-222222222222');
INSERT INTO public._project_files (project_id,file_path,content) VALUES
('proj-a','folder/a.txt','alpha'),
('proj-a','folder/sub/b.txt','beta'),
('proj-a','existing.txt','keep'),
('proj-a','dest/conflict.txt','unchanged'),
('proj-b','private.txt','private');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);

DO $$
DECLARE n integer;
BEGIN
  n := public.rename_builder_project_path('proj-a','folder/a.txt','folder/new.txt');
  IF n <> 1 THEN RAISE EXCEPTION 'single-file rename count wrong'; END IF;
  IF (SELECT content FROM public._project_files WHERE project_id='proj-a' AND file_path='folder/new.txt') <> 'alpha'
    OR EXISTS(SELECT 1 FROM public._project_files WHERE project_id='proj-a' AND file_path='folder/a.txt')
  THEN RAISE EXCEPTION 'single-file rename lost content'; END IF;
END;
$$;

DO $$
BEGIN
  BEGIN
    PERFORM public.rename_builder_project_path('proj-a','folder/new.txt','existing.txt');
    RAISE EXCEPTION 'expected destination collision';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Project rename destination already exists' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.rename_builder_project_path('proj-a','missing.txt','invented.txt');
    RAISE EXCEPTION 'expected missing-source rejection';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Project rename source missing' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.rename_builder_project_path('proj-a','folder','folder/sub/deeper');
    RAISE EXCEPTION 'expected self-descendant rejection';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Cannot rename a path inside itself' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.rename_builder_project_path('proj-a','folder','dest');
    RAISE EXCEPTION 'expected destination-folder collision';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Project rename destination already exists' THEN RAISE; END IF;
  END;
  IF (SELECT content FROM public._project_files WHERE project_id='proj-a' AND file_path='existing.txt') <> 'keep'
    OR (SELECT content FROM public._project_files WHERE project_id='proj-a' AND file_path='folder/new.txt') <> 'alpha'
    OR EXISTS(SELECT 1 FROM public._project_files WHERE project_id='proj-a' AND file_path='invented.txt')
  THEN RAISE EXCEPTION 'failed rename mutated project files'; END IF;
END;
$$;

DO $$
DECLARE n integer;
BEGIN
  n := public.rename_builder_project_path('proj-a','folder','renamed');
  IF n <> 2 OR
    (SELECT content FROM public._project_files WHERE project_id='proj-a' AND file_path='renamed/new.txt') <> 'alpha' OR
    (SELECT content FROM public._project_files WHERE project_id='proj-a' AND file_path='renamed/sub/b.txt') <> 'beta'
  THEN RAISE EXCEPTION 'folder rename failed or lost contents'; END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
DO $$
BEGIN
  BEGIN
    PERFORM public.rename_builder_project_path('proj-a','existing.txt','stolen.txt');
    RAISE EXCEPTION 'expected cross-user rejection';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Project not found or forbidden' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM public._project_files WHERE project_id='proj-a' AND file_path='stolen.txt')
  THEN RAISE EXCEPTION 'cross-user data unexpectedly visible'; END IF;
END;
$$;
RESET ROLE;
-- Verify via the privileged test runner that nobody changed the other owner's rows.
DO $$
BEGIN
  IF (SELECT content FROM public._project_files WHERE project_id='proj-a' AND file_path='existing.txt') <> 'keep' OR
     (SELECT content FROM public._project_files WHERE project_id='proj-b' AND file_path='private.txt') <> 'private'
  THEN RAISE EXCEPTION 'unexpected cross-account mutation'; END IF;
END;
$$;
SELECT 'PASS: atomic rename, collisions, missing sources, folders and RLS owner checks' AS result;
