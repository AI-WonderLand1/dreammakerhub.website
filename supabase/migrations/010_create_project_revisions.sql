-- Builder project revisions with version pruning
-- Mirrors _project_revisions DDL created lazily by lib/projects/storage.ts ensureTables().
-- Runs safely alongside that code (both use IF NOT EXISTS / CREATE OR REPLACE).

CREATE TABLE IF NOT EXISTS _project_revisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_project_revisions_project ON _project_revisions (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_revisions_version ON _project_revisions (project_id, version_number DESC);

CREATE OR REPLACE FUNCTION prune_revisions(p_owner_id TEXT, p_project_id TEXT, p_limit INT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM _project_revisions
  WHERE owner_id = p_owner_id
    AND project_id = p_project_id
    AND id NOT IN (
      SELECT id FROM _project_revisions
      WHERE owner_id = p_owner_id AND project_id = p_project_id
      ORDER BY version_number DESC
      LIMIT p_limit
    );
END;
$$ LANGUAGE plpgsql;
