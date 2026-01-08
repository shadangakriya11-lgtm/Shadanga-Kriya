/**
 * Migration: Rename OTP columns to Access Code
 * 
 * This renames the existing otp_* columns to access_code_* naming
 * and removes any duplicate access_code columns if they exist.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('Cleaning up and renaming OTP columns to Access Code...');

        // Drop new access_code columns if they exist (from the previous migration)
        console.log('Removing duplicate access_code columns...');
        await client.query('DROP INDEX IF EXISTS idx_lessons_access_code');
        await client.query('ALTER TABLE lessons DROP COLUMN IF EXISTS access_code_enabled');
        await client.query('ALTER TABLE lessons DROP COLUMN IF EXISTS access_code');
        await client.query('ALTER TABLE lessons DROP COLUMN IF EXISTS access_code_type');
        await client.query('ALTER TABLE lessons DROP COLUMN IF EXISTS access_code_expires_at');
        await client.query('ALTER TABLE lessons DROP COLUMN IF EXISTS access_code_generated_at');
        await client.query('DROP TYPE IF EXISTS access_code_type');

        // Check if otp columns exist before renaming
        const checkOtp = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'lessons' AND column_name = 'otp_locked'
    `);

        if (checkOtp.rows.length > 0) {
            console.log('Renaming otp_* columns to access_code_*...');

            // Rename columns
            await client.query('ALTER TABLE lessons RENAME COLUMN otp_locked TO access_code_enabled');
            await client.query('ALTER TABLE lessons RENAME COLUMN otp_code TO access_code');
            await client.query('ALTER TABLE lessons RENAME COLUMN otp_type TO access_code_type');
            await client.query('ALTER TABLE lessons RENAME COLUMN otp_expires_at TO access_code_expires_at');
            await client.query('ALTER TABLE lessons RENAME COLUMN otp_generated_at TO access_code_generated_at');

            // Rename index if exists
            await client.query('DROP INDEX IF EXISTS idx_lessons_otp_code');
            await client.query('CREATE INDEX IF NOT EXISTS idx_lessons_access_code ON lessons(access_code)');

            // Rename enum type
            await client.query('ALTER TYPE lesson_otp_type RENAME TO access_code_type');

            console.log('Columns renamed successfully!');
        } else {
            console.log('OTP columns not found. Creating fresh access_code columns...');

            // Create access_code_type enum
            await client.query(`
        DO $$ BEGIN
          CREATE TYPE access_code_type AS ENUM ('permanent', 'temporary');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

            // Add columns
            await client.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS access_code_enabled BOOLEAN DEFAULT true');
            await client.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS access_code VARCHAR(10)');
            await client.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS access_code_type access_code_type DEFAULT \'permanent\'');
            await client.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS access_code_expires_at TIMESTAMP WITH TIME ZONE');
            await client.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS access_code_generated_at TIMESTAMP WITH TIME ZONE');
            await client.query('CREATE INDEX IF NOT EXISTS idx_lessons_access_code ON lessons(access_code)');
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

run().then(() => pool.end()).catch(() => pool.end());
