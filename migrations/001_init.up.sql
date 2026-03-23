-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    namespace VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    author VARCHAR(255),
    license VARCHAR(64),
    homepage VARCHAR(512),
    repository VARCHAR(512),
    keywords TEXT[],
    categories TEXT[],
    visibility VARCHAR(16) DEFAULT 'public',
    latest_version VARCHAR(64),
    downloads BIGINT DEFAULT 0,
    stars BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(namespace, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_skills_namespace ON skills(namespace);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_keywords ON skills USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_skills_categories ON skills USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_skills_downloads ON skills(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_skills_stars ON skills(stars DESC);
CREATE INDEX IF NOT EXISTS idx_skills_created_at ON skills(created_at DESC);

-- Create versions table
CREATE TABLE IF NOT EXISTS versions (
    id VARCHAR(255) PRIMARY KEY,
    skill_id VARCHAR(255) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    version VARCHAR(64) NOT NULL,
    description TEXT,
    changelog TEXT,
    skill_md_url VARCHAR(512) NOT NULL,
    skill_md_hash VARCHAR(128),
    dependencies JSONB,
    compatibility TEXT[],
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deprecated BOOLEAN DEFAULT FALSE,
    yanked BOOLEAN DEFAULT FALSE,

    UNIQUE(skill_id, version)
);

-- Create indexes for versions
CREATE INDEX IF NOT EXISTS idx_versions_skill_id ON versions(skill_id);
CREATE INDEX IF NOT EXISTS idx_versions_published_at ON versions(published_at DESC);

-- Create users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(256),
    avatar_url VARCHAR(512),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    display_name VARCHAR(128),
    description TEXT,
    avatar_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
    org_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY(org_id, user_id)
);

-- Create security_reports table
CREATE TABLE IF NOT EXISTS security_reports (
    id VARCHAR(64) PRIMARY KEY,
    version_id VARCHAR(255) REFERENCES versions(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    score INTEGER,
    findings JSONB,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_reports_version_id ON security_reports(version_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-update
CREATE TRIGGER update_skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();