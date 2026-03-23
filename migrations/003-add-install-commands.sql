-- Add install_commands column to versions table
ALTER TABLE versions ADD COLUMN IF NOT EXISTS install_commands JSONB DEFAULT '[]'::jsonb;

-- Add compatibility column if missing
ALTER TABLE versions ADD COLUMN IF NOT EXISTS compatibility TEXT[] DEFAULT '{}';