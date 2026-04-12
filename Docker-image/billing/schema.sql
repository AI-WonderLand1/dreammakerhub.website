-- WonderSpace Billing Database Schema
-- Run this in PostgreSQL to track usage and billing

-- Users table (extends Coder's user management)
CREATE TABLE IF NOT EXISTS wonderspace_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coder_user_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    api_key VARCHAR(255) UNIQUE, -- WonderSpace branded API key (NOT OpenCode key)
    tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    monthly_quota INTEGER DEFAULT 100, -- requests per month
    quota_used INTEGER DEFAULT 0,
    quota_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage tracking
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES wonderspace_users(id),
    workspace_id UUID,
    request_type VARCHAR(50) CHECK (request_type IN ('text', 'voice', 'agent', 'runner')),
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,6) DEFAULT 0.000000,
    charged_usd DECIMAL(10,6) DEFAULT 0.000000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly billing records
CREATE TABLE IF NOT EXISTS monthly_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES wonderspace_users(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    tier VARCHAR(20) NOT NULL,
    subscription_amount DECIMAL(10,2) DEFAULT 0.00,
    usage_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    paid_at TIMESTAMP,
    UNIQUE(user_id, year, month)
);

-- API keys for OpenCode (your keys, not user keys)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL, -- 'opencode', 'openai', etc.
    api_key_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX idx_monthly_bills_user_id ON monthly_bills(user_id);
CREATE INDEX idx_monthly_bills_status ON monthly_bills(status);
CREATE INDEX idx_wonderspace_users_api_key ON wonderspace_users(api_key);

-- Function to calculate monthly usage
CREATE OR REPLACE FUNCTION calculate_monthly_usage(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(charged_usd), 0.00)
    INTO v_total
    FROM ai_usage
    WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM created_at) = p_year
    AND EXTRACT(MONTH FROM created_at) = p_month;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Function to reset quotas monthly
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
    UPDATE wonderspace_users
    SET quota_used = 0,
        quota_reset_at = CURRENT_TIMESTAMP
    WHERE quota_reset_at < DATE_TRUNC('month', CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Insert your API key (replace with your actual encrypted key)
-- INSERT INTO api_keys (service, api_key_encrypted) 
-- VALUES ('opencode', 'your-encrypted-api-key-here');

-- Grant permissions (run as superuser)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO coder;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO coder;