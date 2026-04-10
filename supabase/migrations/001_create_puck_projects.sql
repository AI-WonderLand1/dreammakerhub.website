-- Create puck_projects table for BYOC Puck Editor
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS puck_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{"content": [], "root": {}}',
  meta JSONB DEFAULT '{}',
  storage_type TEXT NOT NULL DEFAULT 'temp' CHECK (storage_type IN ('temp', 'platform', 'byoc')),
  temp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS puck_projects_user_id_idx ON puck_projects(user_id);
CREATE INDEX IF NOT EXISTS puck_projects_updated_at_idx ON puck_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS puck_projects_temp_expires_idx ON puck_projects(temp_expires_at) WHERE storage_type = 'temp';

-- Function to auto-delete expired temp projects
CREATE OR REPLACE FUNCTION cleanup_expired_projects()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM puck_projects
  WHERE storage_type = 'temp'
  AND temp_expires_at < NOW();
END;
$$;

-- Schedule cleanup every hour
SELECT cron.schedule(
  'cleanup-expired-projects',
  '0 * * * *',
  'SELECT cleanup_expired_projects()'
);
