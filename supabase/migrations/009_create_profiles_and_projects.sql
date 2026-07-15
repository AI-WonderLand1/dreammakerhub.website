-- Projects and user_profiles tables with subscription limits
-- Run this in your Supabase SQL Editor
-- CAREFUL: This migration will FAIL if tables exist. Run manually or drop tables first.

-- 1. Create user_profiles table with subscription limits + AI tokens + compute
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'team', 'enterprise')),
  
  -- Storage limits (bytes)
  storage_limit BIGINT NOT NULL DEFAULT 104857600, -- 100 MB free
  
  -- Project limits
  projects_limit INTEGER NOT NULL DEFAULT 1,
  
  -- Workspace/IDE limits
  workspaces_limit INTEGER NOT NULL DEFAULT 0,
  ide_sessions_limit INTEGER NOT NULL DEFAULT 0,
  
  -- Compute & AI limits
  compute_credits_monthly INTEGER NOT NULL DEFAULT 10000,
  ai_tokens_monthly INTEGER NOT NULL DEFAULT 5000,
  runtime_hours_monthly INTEGER NOT NULL DEFAULT 0,
  api_calls_monthly INTEGER NOT NULL DEFAULT 100,
  
  -- Usage tracking
  storage_used BIGINT DEFAULT 0,
  compute_used INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,
  runtime_hours_used INTEGER DEFAULT 0,
  api_calls_used INTEGER DEFAULT 0,
  
  -- Period reset
  usage_period_start TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create projects table with owner_id
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'wonderbuild' CHECK (type IN ('wonderbuild', 'playcanvas', 'puck', 'workspace', 'game', 'web_app', '3d_scene')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  content JSONB DEFAULT '{}',
  storage_used BIGINT DEFAULT 0,
  runtime_url TEXT,
  deployed_url TEXT,
  is_current BOOLEAN DEFAULT false,
  runtime_hours_limit INTEGER DEFAULT 0,
  runtime_hours_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  compute_credits_used INTEGER DEFAULT 0,
  runtime_minutes INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 1,
  cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'feedback' CHECK (type IN ('feedback', 'bug')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4b. Create client_error_logs table for frontend errors
CREATE TABLE IF NOT EXISTS client_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS projects_owner_id_idx ON projects(owner_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS user_profiles_id_idx ON user_profiles(id);
CREATE INDEX IF NOT EXISTS usage_logs_user_id_idx ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS usage_logs_project_id_idx ON usage_logs(project_id);
CREATE INDEX IF NOT EXISTS usage_logs_created_at_idx ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON support_tickets(user_id);

-- 6. Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. RLS POLICIES - CRITICAL FOR SECURITY
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- user_profiles: Only owner can view/update
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- projects: Only owner can view/create/update/delete
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create projects" ON projects;
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- usage_logs: Only owner can view/insert
DROP POLICY IF EXISTS "Users can view own usage" ON usage_logs;
CREATE POLICY "Users can view own usage" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert usage" ON usage_logs;
CREATE POLICY "Users can insert usage" ON usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- support_tickets: Only owner can view/insert
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- client_error_logs: Allow anyone to insert (for error tracking), only authenticated users can view their own
ALTER TABLE client_error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert error logs" ON client_error_logs;
CREATE POLICY "Authenticated users can insert error logs" ON client_error_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view own error logs" ON client_error_logs;
CREATE POLICY "Users can view own error logs" ON client_error_logs
  FOR SELECT USING (auth.uid() = user_id);