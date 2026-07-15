-- Create project_domains table for custom domain management
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS project_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  publish_id TEXT NOT NULL,
  custom_domain TEXT NOT NULL UNIQUE,
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure domain format is valid
  CONSTRAINT valid_domain CHECK (
    custom_domain ~ '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$'
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS project_domains_custom_domain_idx ON project_domains(custom_domain);
CREATE INDEX IF NOT EXISTS project_domains_project_id_idx ON project_domains(project_id);
CREATE INDEX IF NOT EXISTS project_domains_is_active_idx ON project_domains(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS project_domains_verified_at_idx ON project_domains(verified_at) WHERE verified_at IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER project_domains_updated_at
  BEFORE UPDATE ON project_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_project_domains_updated_at();

-- RLS Policies
ALTER TABLE project_domains ENABLE ROW LEVEL SECURITY;

-- Public can view active, verified domains (for domain resolution)
CREATE POLICY "Public can view active verified domains" 
  ON project_domains FOR SELECT 
  USING (is_active = true AND verified_at IS NOT NULL);

-- Function to verify domain ownership via verification_token
CREATE OR REPLACE FUNCTION verify_project_domain(
  domain_id UUID,
  verification_token TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  domain_record RECORD;
BEGIN
  SELECT id, verification_token INTO domain_record
  FROM project_domains
  WHERE id = domain_id
    AND is_active = true
    AND verified_at IS NULL;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF domain_record.verification_token IS DISTINCT FROM verification_token THEN
    RAISE EXCEPTION 'Invalid verification token';
  END IF;

  UPDATE project_domains
  SET verified_at = NOW(),
      updated_at = NOW()
  WHERE id = domain_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;