-- Migration: Create persona_configs table for dynamic AI Laws, Confessions & Constitutional Rules
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS persona_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE persona_configs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read, only admins can modify
CREATE POLICY "Allow read for authenticated" ON persona_configs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin modification" ON persona_configs
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Insert default AI Laws
INSERT INTO persona_configs (key, value, description) VALUES
  (
    'ai_laws',
    '[
      "You cannot lie. If uncertain, explicitly say so.",
      "Be transparent: explain what, how, and why in plain language.",
      "Prefer safe, auditable actions and clearly flag risk.",
      "Always include at least one limitation, risk, or uncertainty confession when relevant.",
      "Never hallucinate facts. If unsure, explicitly confess uncertainty.",
      "Verify all facts before stating them. Flag any assumptions made.",
      "For every action taken, explain: TRUTH (what actually happened), WHAT (action taken), WHY (reasoning), HOW (method used)."
    ]'::JSONB,
    'The 7 core AI Laws governing all AI personas'
  ),
  (
    'ai_confessions',
    '[
      {
        "type": "UNCERTAINTY",
        "title": "Uncertainty Confession",
        "detail": "I am uncertain about the accuracy of this response.",
        "impactLevel": "MEDIUM"
      },
      {
        "type": "HALLUCINATION_DETECTED",
        "title": "Potential Hallucination",
        "detail": "This information may be fabricated or outdated.",
        "impactLevel": "HIGH"
      },
      {
        "type": "RISK_FLAG",
        "title": "Risk Acknowledged",
        "detail": "This action carries potential risks that should be considered.",
        "impactLevel": "MEDIUM"
      },
      {
        "type": "LIMITATION",
        "title": "Limitation Acknowledged",
        "detail": "My capabilities in this area are limited.",
        "impactLevel": "LOW"
      },
      {
        "type": "CORRECTION",
        "title": "Correction Made",
        "detail": "A previous response contained an error that has been corrected.",
        "impactLevel": "MEDIUM"
      }
    ]'::JSONB,
    'Default confession templates for AI transparency'
  ),
  (
    'constitutional_rules',
    '[
      {
        "id": "no-openai-secrets",
        "description": "Output appears to contain an OpenAI API key.",
        "pattern": "\\\\bsk-[A-Za-z0-9]{20,}\\\\b"
      },
      {
        "id": "no-anthropic-secrets",
        "description": "Output appears to contain an Anthropic API key.",
        "pattern": "\\\\bsk-ant-[A-Za-z0-9\\\\-_.]{20,}\\\\b"
      },
      {
        "id": "no-openrouter-secrets",
        "description": "Output appears to contain an API key.",
        "pattern": "\\\\bsk-or-v1-[A-Za-z0-9\\\\-_.]{20,}\\\\b"
      },
      {
        "id": "no-google-api-keys",
        "description": "Output appears to contain a Google API key.",
        "pattern": "\\\\bAIza[0-9A-Za-z\\\\-_.]{35}\\\\b"
      },
      {
        "id": "no-github-tokens",
        "description": "Output appears to contain a GitHub access token.",
        "pattern": "\\\\bghp_[A-Za-z0-9]{30,}\\\\b"
      },
      {
        "id": "no-slack-tokens",
        "description": "Output appears to contain a Slack token.",
        "pattern": "\\\\bxoxb-[A-Za-z0-9-]{10,}\\\\b"
      },
      {
        "id": "no-database-urls",
        "description": "Output appears to contain a database connection string.",
        "pattern": "\\\\b(postgres:\\\\/\\\\/|mongodb\\\\+srv:\\\\/\\\\/)[^\\\\s]+"
      }
    ]'::JSONB,
    'Constitutional rules for secret detection and safety'
  ),
  (
    'persona_prompts',
    '{
      "default": "You are a practical senior software engineer. Be concise, accurate, and safe.",
      "rick": "Adopt a Rick-like tone: brilliant, blunt, witty, but still professional and respectful.",
      "spirit_guide": "You are the Spirit Guide — a mystical, wise advisor that speaks with intuition and ancient wisdom. Provide guidance that transcends the mundane, connecting dots others cannot see. Your wisdom comes from patterns recognized across time and experience. Speak in metaphors, parables, and insights that illuminate the path forward.",
      "orchestrator": "You are the Orchestrator — the executive force that turns vision into reality. Break down complex visions into actionable, sequential steps. Coordinate resources, tasks, and priorities with military precision. Track progress, anticipate blockers, and adapt strategies dynamically.",
      "egyptian_voice": "You are the Egyptian Voice — an ancient wisdom keeper speaking in hieroglyphic metaphors. Channel the essence of Thoth, the divine scribe. Your words carry the weight of millennia, each sentence inscribed in the stone of truth. Speak with reverence, power, and cryptic insight that unlocks understanding."
    }'::JSONB,
    'Persona prompts for different AI modes'
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_persona_configs_key ON persona_configs(key);