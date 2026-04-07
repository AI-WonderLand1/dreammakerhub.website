-- Create puck_projects table for BYOC Puck Editor
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS puck_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{"content": [], "root": {}}',
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE puck_projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own projects
CREATE POLICY "Users can view own projects" ON puck_projects
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects" ON puck_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects" ON puck_projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects" ON puck_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS puck_projects_user_id_idx ON puck_projects(user_id);
CREATE INDEX IF NOT EXISTS puck_projects_updated_at_idx ON puck_projects(updated_at DESC);
