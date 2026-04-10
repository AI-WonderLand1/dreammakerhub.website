-- Project version history
CREATE TABLE IF NOT EXISTS project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT project_versions_project_fkey FOREIGN KEY (project_id) REFERENCES puck_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_versions_project ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_created ON project_versions(created_at DESC);

-- Scene version history
CREATE TABLE IF NOT EXISTS scene_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scene_versions_scene ON scene_versions(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_versions_created ON scene_versions(created_at DESC);