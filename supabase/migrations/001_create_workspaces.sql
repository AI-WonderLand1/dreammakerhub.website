-- Create workspaces table for scene isolation
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id TEXT UNIQUE NOT NULL,
  owner_id TEXT,
  status TEXT DEFAULT 'READY',
  container_id TEXT,
  resources JSONB DEFAULT '{"cpu": 2, "memoryGB": 4, "storageGB": 5}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_scene_id ON workspaces(scene_id);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their workspaces" ON workspaces
  FOR SELECT USING (auth.uid()::text = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their workspaces" ON workspaces
  FOR UPDATE USING (auth.uid()::text = owner_id);

-- Comments
COMMENT ON TABLE workspaces IS 'Scene workspace isolation - tracks virtual workspaces per sceneId';
COMMENT ON COLUMN workspaces.scene_id IS 'Unique scene identifier from URL';
COMMENT ON COLUMN workspaces.status IS 'READY, PROVISIONING, ERROR, DELETED';