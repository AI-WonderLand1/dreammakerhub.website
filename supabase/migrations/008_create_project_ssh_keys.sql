-- Create project_ssh_keys table for per-project SSH keys
-- This stores SSH keys that give users access to their isolated runtime pods
-- The private key is encrypted so even admins can't see user keys

CREATE TABLE IF NOT EXISTS project_ssh_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE,
  private_key_encrypted TEXT NOT NULL,
  public_key TEXT NOT NULL,
  key_type TEXT NOT NULL DEFAULT 'ed25519',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS - users can only see their own keys via join
ALTER TABLE project_ssh_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Owner can read their project SSH keys
CREATE POLICY "project_owner_can_read_ssh_keys" 
  ON project_ssh_keys FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Policy: Owner can update their project SSH keys
CREATE POLICY "project_owner_can_update_ssh_keys" 
  ON project_ssh_keys FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Policy: Owner can insert their project SSH keys
CREATE POLICY "project_owner_can_insert_ssh_keys" 
  ON project_ssh_keys FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Index for fast lookups by project_id
CREATE INDEX IF NOT EXISTS idx_project_ssh_keys_project_id 
  ON project_ssh_keys(project_id);

COMMENT ON TABLE project_ssh_keys IS 'Per-project SSH keys for isolating user runtime access';
COMMENT ON COLUMN project_ssh_keys.private_key_encrypted IS 'SSH private key encrypted with server key';
COMMENT ON COLUMN project_ssh_keys.public_key IS 'SSH public key for authorized_keys file';