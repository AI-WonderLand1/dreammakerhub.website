CREATE TABLE IF NOT EXISTS public._projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  tool TEXT,
  publish_enabled BOOLEAN DEFAULT false,
  custom_domain TEXT,
  last_publish_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public._project_files (
  project_id TEXT NOT NULL REFERENCES public._projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, file_path)
);

CREATE TABLE IF NOT EXISTS public._project_revisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public._projects(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_updated ON public._projects (owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_files_project ON public._project_files (project_id);
CREATE INDEX IF NOT EXISTS idx_project_revisions_project ON public._project_revisions (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_revisions_version ON public._project_revisions (project_id, version_number DESC);

CREATE OR REPLACE FUNCTION public.prune_revisions(p_owner_id TEXT, p_project_id TEXT, p_limit INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public._project_revisions
  WHERE owner_id = p_owner_id
    AND project_id = p_project_id
    AND id NOT IN (
      SELECT id FROM public._project_revisions
      WHERE owner_id = p_owner_id AND project_id = p_project_id
      ORDER BY version_number DESC
      LIMIT p_limit
    );
END;
$$;
