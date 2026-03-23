-- ClawSkill Database Initialization Script
-- This script creates the necessary tables and indexes for ClawSkill.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For trigram similarity search

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    namespace VARCHAR(255) NOT NULL,
    description TEXT,
    author VARCHAR(255),
    license VARCHAR(64),
    homepage VARCHAR(512),
    repository VARCHAR(512),
    keywords TEXT[],
    categories TEXT[],
    visibility VARCHAR(16) DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    latest_version VARCHAR(64),
    downloads BIGINT DEFAULT 0,
    stars BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT skills_name_check CHECK (name ~ '^[a-z0-9][-a-z0-9_]*$'),
    CONSTRAINT skills_namespace_check CHECK (namespace ~ '^[a-z0-9][-a-z0-9_]*$'),
    CONSTRAINT skills_id_format_check CHECK (id = namespace || '/' || name)
);

-- Create versions table
CREATE TABLE IF NOT EXISTS versions (
    id VARCHAR(320) PRIMARY KEY,
    skill_id VARCHAR(255) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    version VARCHAR(64) NOT NULL,
    description TEXT,
    changelog TEXT,
    skill_md_url VARCHAR(512),
    skill_md_hash VARCHAR(64),
    dependencies JSONB,
    compatibility TEXT[],
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deprecated BOOLEAN DEFAULT FALSE,
    yanked BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT versions_version_check CHECK (version ~ '^v?[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$'),
    CONSTRAINT versions_id_format_check CHECK (id = skill_id || '@' || version),
    UNIQUE (skill_id, version)
);

-- Create indexes for skills table
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_namespace ON skills(namespace);
CREATE INDEX IF NOT EXISTS idx_skills_author ON skills(author);
CREATE INDEX IF NOT EXISTS idx_skills_visibility ON skills(visibility);
CREATE INDEX IF NOT EXISTS idx_skills_downloads ON skills(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_skills_stars ON skills(stars DESC);
CREATE INDEX IF NOT EXISTS idx_skills_created_at ON skills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skills_updated_at ON skills(updated_at DESC);

-- Create GIN index for array search
CREATE INDEX IF NOT EXISTS idx_skills_keywords ON skills USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_skills_categories ON skills USING GIN(categories);

-- Create trigram index for full-text search
CREATE INDEX IF NOT EXISTS idx_skills_name_trgm ON skills USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_skills_description_trgm ON skills USING GIN(description gin_trgm_ops);

-- Create indexes for versions table
CREATE INDEX IF NOT EXISTS idx_versions_skill_id ON versions(skill_id);
CREATE INDEX IF NOT EXISTS idx_versions_published_at ON versions(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_versions_yanked ON versions(yanked) WHERE yanked = FALSE;

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit log table (optional, for tracking changes)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(64) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    action VARCHAR(16) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at DESC);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO clawskill;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO clawskill;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO clawskill;