-- Playground Sync Pipeline Migration
-- Creates tables for syncing data between main site and playground.dreammakerhub.website

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Sync Keys - Authentication for sync endpoints
CREATE TABLE IF NOT EXISTS sync_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Index for fast key lookup
CREATE INDEX IF NOT EXISTS idx_sync_keys_key ON sync_keys(key);
CREATE INDEX IF NOT EXISTS idx_sync_keys_active ON sync_keys(active);

-- 2. Playground Usage - Track token usage from playground
CREATE TABLE IF NOT EXISTS playground_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  total_tokens INTEGER DEFAULT 0,
  last_model TEXT,
  last_session_id TEXT,
  metadata JSONB DEFAULT '{}',
  source TEXT DEFAULT 'playground',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for user lookups
CREATE INDEX IF NOT EXISTS idx_playground_usage_user_id ON playground_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_usage_synced_at ON playground_usage(synced_at);

-- 3. Token Balances - Track token balance across platforms
CREATE TABLE IF NOT EXISTS token_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  balance INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'playground',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_token_balances_user_id ON token_balances(user_id);

-- 4. Token Transactions - Audit log for token changes
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('add', 'subtract', 'set')),
  amount INTEGER NOT NULL,
  previous_balance INTEGER DEFAULT 0,
  new_balance INTEGER DEFAULT 0,
  reason TEXT,
  transaction_id TEXT,
  source TEXT DEFAULT 'playground',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user lookups and date range queries
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_created ON token_transactions(user_id, created_at DESC);

-- 5. Playground Sessions - Track session status from playground
CREATE TABLE IF NOT EXISTS playground_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'active', 'completed', 'error')),
  session_id TEXT,
  model TEXT DEFAULT 'unknown',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  source TEXT DEFAULT 'playground',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user lookups and status filtering
CREATE INDEX IF NOT EXISTS idx_playground_sessions_user_id ON playground_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_sessions_status ON playground_sessions(status);
CREATE INDEX IF NOT EXISTS idx_playground_sessions_created_at ON playground_sessions(created_at);

-- 6. Sync Log - Audit log for all sync events
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying sync events
CREATE INDEX IF NOT EXISTS idx_sync_log_source ON sync_log(source);
CREATE INDEX IF NOT EXISTS idx_sync_log_event_type ON sync_log(event_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_user_id ON sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON sync_log(created_at);

-- 7. Create a view for combined usage stats
CREATE OR REPLACE VIEW combined_usage_view AS
SELECT 
  COALESCE(pu.user_id, tb.user_id) as user_id,
  COALESCE(pu.total_tokens, 0) as playground_tokens,
  COALESCE(tb.balance, 0) as token_balance,
  COALESCE(pu.last_model, 'N/A') as last_playground_model,
  pu.synced_at as last_synced
FROM playground_usage pu
FULL OUTER JOIN token_balances tb ON pu.user_id = tb.user_id;

-- 8. RLS Policies (Row Level Security)
ALTER TABLE sync_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage sync_keys" ON sync_keys FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage playground_usage" ON playground_usage FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage token_balances" ON token_balances FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage token_transactions" ON token_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage playground_sessions" ON playground_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage sync_log" ON sync_log FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own data
CREATE POLICY "Users can read own playground_usage" ON playground_usage FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can read own token_balances" ON token_balances FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can read own token_transactions" ON token_transactions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can read own playground_sessions" ON playground_sessions FOR SELECT USING (auth.uid()::text = user_id);

-- Insert initial sync key for playground (CHANGE THIS IN PRODUCTION!)
INSERT INTO sync_keys (key, name) VALUES 
  ('dmh_playground_sync_key_change_me_in_production', 'Playground Sync Key')
ON CONFLICT (key) DO NOTHING;
