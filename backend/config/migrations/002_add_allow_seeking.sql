-- Add allow_seeking column to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS allow_seeking BOOLEAN DEFAULT false;

-- Update existing lessons to have allow_seeking = false by default
UPDATE lessons SET allow_seeking = false WHERE allow_seeking IS NULL;
