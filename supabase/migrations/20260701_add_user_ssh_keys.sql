-- Add SSH key columns to user_profiles for IDE workspace provisioning
-- These store the user's personal SSH keypair used to access their Coder IDE pod

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS ssh_public_key TEXT,
  ADD COLUMN IF NOT EXISTS ssh_private_key_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS ssh_key_generated_at TIMESTAMPTZ;

-- Index for quick lookup by SSH public key (for authorized_keys injection)
CREATE INDEX IF NOT EXISTS idx_user_profiles_ssh_public_key
  ON user_profiles(ssh_public_key)
  WHERE ssh_public_key IS NOT NULL;

COMMENT ON COLUMN user_profiles.ssh_public_key IS 'User SSH public key for IDE workspace access';
COMMENT ON COLUMN user_profiles.ssh_private_key_encrypted IS 'Encrypted SSH private key, only retrievable by the user';
COMMENT ON COLUMN user_profiles.ssh_key_generated_at IS 'When the SSH keypair was generated';
