-- Add missing columns for ClawSkill TypeScript implementation

-- Add version column to skills table
ALTER TABLE skills ADD COLUMN IF NOT EXISTS version VARCHAR(64) DEFAULT '0.0.1';

-- Add install_commands column to versions table  
ALTER TABLE versions ADD COLUMN IF NOT EXISTS install_commands JSONB DEFAULT '[]';

-- Fix versions table: allow auto-increment id alongside the text id
-- The existing schema uses text id, but Kysely expects numeric id
-- We'll add a serial column and keep the text id as a unique constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='versions' AND column_name='num_id') THEN
    ALTER TABLE versions ADD COLUMN num_id SERIAL;
  END IF;
END$$;

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    key VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    scopes TEXT[] DEFAULT ARRAY['read'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Insert a default development API key
INSERT INTO api_keys (key, name, scopes)
VALUES ('cs_dev_key_for_testing_only_12345678', 'development', ARRAY['read', 'write'])
ON CONFLICT (key) DO NOTHING;
