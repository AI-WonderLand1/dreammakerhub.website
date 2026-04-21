-- Enable Row Level Security on puck_projects and version tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on puck_projects
ALTER TABLE puck_projects ENABLE ROW LEVEL SECURITY;

-- Enable RLS on project_versions
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on scene_versions
ALTER TABLE scene_versions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_environments
ALTER TABLE user_environments ENABLE ROW LEVEL SECURITY;

-- ========== puck_projects policies ==========
-- Users can only see their own projects
CREATE POLICY "Users can view own projects"
ON puck_projects FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own projects
CREATE POLICY "Users can insert own projects"
ON puck_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own projects
CREATE POLICY "Users can update own projects"
ON puck_projects FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own projects
CREATE POLICY "Users can delete own projects"
ON puck_projects FOR DELETE
USING (auth.uid() = user_id);

-- ========== project_versions policies ==========
-- Users can only see versions of their own projects (via join to puck_projects)
CREATE POLICY "Users can view own project versions"
ON project_versions FOR SELECT
USING (
  project_id IN (
    SELECT id FROM puck_projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own project versions"
ON project_versions FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM puck_projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own project versions"
ON project_versions FOR DELETE
USING (
  project_id IN (
    SELECT id FROM puck_projects WHERE user_id = auth.uid()
  )
);

-- ========== scene_versions policies ==========
-- Users can only see versions of their own scenes (via user_id)
CREATE POLICY "Users can view own scene versions"
ON scene_versions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scene versions"
ON scene_versions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scene versions"
ON scene_versions FOR DELETE
USING (auth.uid() = user_id);

-- ========== user_environments policies ==========
CREATE POLICY "Users can view own environments"
ON user_environments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own environments"
ON user_environments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own environments"
ON user_environments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own environments"
ON user_environments FOR DELETE
USING (auth.uid() = user_id);