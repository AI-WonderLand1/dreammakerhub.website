-- Create marketplace tables for package management
-- Run this in your Supabase SQL Editor

-- Marketplace packages table
CREATE TABLE IF NOT EXISTS marketplace_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  author TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  github_url TEXT,
  download_url TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  install_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace installs tracking table
CREATE TABLE IF NOT EXISTS marketplace_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES marketplace_packages(id) ON DELETE CASCADE,
  project_id TEXT,
  version TEXT NOT NULL DEFAULT 'latest',
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_marketplace_package FOREIGN KEY (package_id) 
    REFERENCES marketplace_packages(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS marketplace_packages_category_idx ON marketplace_packages(category);
CREATE INDEX IF NOT EXISTS marketplace_packages_tags_idx ON marketplace_packages USING gin(tags);
CREATE INDEX IF NOT EXISTS marketplace_packages_created_at_idx ON marketplace_packages(created_at DESC);

CREATE INDEX IF NOT EXISTS marketplace_installs_user_id_idx ON marketplace_installs(user_id);
CREATE INDEX IF NOT EXISTS marketplace_installs_package_id_idx ON marketplace_installs(package_id);
CREATE INDEX IF NOT EXISTS marketplace_installs_installed_at_idx ON marketplace_installs(installed_at DESC);

-- RLS Policies
ALTER TABLE marketplace_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_installs ENABLE ROW LEVEL SECURITY;

-- Public can view marketplace packages
CREATE POLICY "Anyone can view marketplace packages" 
  ON marketplace_packages FOR SELECT 
  USING (true);

-- Only authenticated users can insert install records
CREATE POLICY "Users can insert their own installs" 
  ON marketplace_installs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own installs
CREATE POLICY "Users can view their own installs" 
  ON marketplace_installs FOR SELECT 
  USING (auth.uid() = user_id);

-- Function to update package updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_package_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER marketplace_packages_updated_at
  BEFORE UPDATE ON marketplace_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_package_updated_at();