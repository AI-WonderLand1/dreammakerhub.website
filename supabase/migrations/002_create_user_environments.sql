-- Create user_environments table for tracking isolated development environments
CREATE TABLE IF NOT EXISTS user_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID, -- References your projects table (adjust as needed)
    status TEXT NOT NULL CHECK (status IN ('provisioning', 'running', 'stopped', 'deleted', 'error')),
    container_id TEXT, -- Docker/Kubernetes container ID when provisioned
    resources JSONB, -- Resource allocation (CPU, memory, storage limits)
    last_accessed TIMESTAMPTZ WITH TIME ZONE,
    created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_environments_user_id ON user_environments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_environments_project_id ON user_environments(project_id);
CREATE INDEX IF NOT EXISTS idx_user_environments_status ON user_environments(status);
CREATE INDEX IF NOT EXISTS idx_user_environments_last_accessed ON user_environments(last_accessed);

-- Enable real-time subscriptions for this table
alter publication supabase_realtime add table user_environments;