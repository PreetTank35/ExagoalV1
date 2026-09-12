-- ==============================================================================
-- EXAGOAL SUPABASE COMPLETE DATABASE SETUP
-- ==============================================================================
-- This script sets up BOTH the Relational SQL Database and the Vector Database
-- in Supabase. You can execute this directly in your Supabase SQL Editor:
-- (Supabase Dashboard -> Project -> SQL Editor -> New Query -> Paste & Run)
-- ==============================================================================

-- ==============================================================================
-- PART 1: RELATIONAL SQL DATABASE TABLES (Used by SQL_DATABASE_URL)
-- Stores Exam metadata, individual Questions, and Institute context items.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS exam (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    institute_id VARCHAR(100) DEFAULT 'default-institute',
    subject VARCHAR(100) DEFAULT 'General',
    max_marks INTEGER DEFAULT 100,
    n_questions INTEGER DEFAULT 5,
    per_unit_weights_json TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE IF NOT EXISTS question (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    q_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    marks INTEGER DEFAULT 10,
    image_path VARCHAR(500),
    image_spec_json TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE IF NOT EXISTS contextitem (
    id SERIAL PRIMARY KEY,
    institute_id VARCHAR(100) DEFAULT 'default-institute',
    content TEXT NOT NULL,
    item_type VARCHAR(100) DEFAULT 'general',
    subject VARCHAR(100) DEFAULT 'General',
    source_file VARCHAR(255),
    metadata_json TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE IF NOT EXISTS instituteconfig (
    id SERIAL PRIMARY KEY,
    institute_id VARCHAR(100) NOT NULL UNIQUE,
    config_json TEXT NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_exam_institute_subject ON exam(institute_id, subject);
CREATE INDEX IF NOT EXISTS idx_exam_created_at ON exam(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_exam_id ON question(exam_id);
CREATE INDEX IF NOT EXISTS idx_contextitem_institute ON contextitem(institute_id);
CREATE INDEX IF NOT EXISTS idx_instituteconfig_institute ON instituteconfig(institute_id);

-- ==============================================================================
-- PART 2: VECTOR DATABASE TABLE (Used by PGVECTOR_URL)
-- Stores 384-dimensional dense semantic vectors with Cosine Similarity Index.
-- Kept strictly decoupled from the relational database logic.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS institute_document_chunks (
    id SERIAL PRIMARY KEY,
    institute_id VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    source_file VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'text',
    chunk_index INTEGER DEFAULT 0,
    content TEXT NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    embedding vector(384),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'institute_document_chunks' AND column_name = 'metadata'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'institute_document_chunks' AND column_name = 'metadata_json'
    ) THEN
        ALTER TABLE institute_document_chunks RENAME COLUMN metadata TO metadata_json;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chunks_institute_subject 
    ON institute_document_chunks(institute_id, subject);

CREATE INDEX IF NOT EXISTS idx_chunks_source_file 
    ON institute_document_chunks(institute_id, source_file);

CREATE INDEX IF NOT EXISTS idx_chunks_embedding_cosine 
    ON institute_document_chunks USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

