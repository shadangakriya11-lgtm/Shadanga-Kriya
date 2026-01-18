-- Demo Meditation Feature Migration
-- Run this migration to add demo-related columns to the users table

-- Add demo columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_watched_demo BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_watched_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_skipped BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_questionnaire_responses JSONB;

-- Create app_settings table if it doesn't exist (for storing demo audio URL)
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default demo audio URL setting (can be updated by admin)
INSERT INTO app_settings (key, value, description)
VALUES ('demo_audio_url', '', 'URL for the encrypted demo meditation audio file')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster demo status queries
CREATE INDEX IF NOT EXISTS idx_users_demo_status ON users(has_watched_demo, demo_skipped);

-- Comment on columns for documentation
COMMENT ON COLUMN users.has_watched_demo IS 'Whether the user has watched the demo meditation (one-time only)';
COMMENT ON COLUMN users.demo_watched_at IS 'Timestamp when the user watched the demo';
COMMENT ON COLUMN users.demo_skipped IS 'Whether the user skipped the demo';
COMMENT ON COLUMN users.demo_questionnaire_responses IS 'JSON object storing the 5 priming question responses';
