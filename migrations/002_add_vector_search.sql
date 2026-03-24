-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for semantic search
CREATE TABLE IF NOT EXISTS skill_embeddings (
    id SERIAL PRIMARY KEY,
    skill_id VARCHAR(255) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    version_id VARCHAR(255),
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_skill_version UNIQUE(skill_id, version_id)
);

-- Create HNSW vector index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_skill_embeddings_embedding_hnsw
    ON skill_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_skill_embeddings_skill_id ON skill_embeddings(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_embeddings_created_at ON skill_embeddings(created_at DESC);

-- Add embedding column to skills table (for quick lookup)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS embedding_summary TEXT;

-- Create function to update embeddings
CREATE OR REPLACE FUNCTION update_skill_embedding(skill_id_param VARCHAR(255))
RETURNS void AS $$
BEGIN
    -- This would be called by the embedding service
    -- Placeholder for future implementation
END;
$$ LANGUAGE plpgsql;