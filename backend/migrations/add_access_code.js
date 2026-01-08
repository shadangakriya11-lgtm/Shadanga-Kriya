/**
 * Migration: Add Access Code columns to lessons table
 * 
 * This adds support for lesson access codes (permanent or temporary)
 * that learners must enter to start a lesson.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function up() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('Creating access_code_type enum...');
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE access_code_type AS ENUM ('permanent', 'temporary');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

        console.log('Adding access code columns to lessons table...');

        // access_code_enabled - whether this lesson requires an access code (default true for new lessons)
        await client.query(`
      ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS access_code_enabled BOOLEAN DEFAULT true;
    `);

        // access_code - the 6-digit code learners enter
        await client.query(`
      ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS access_code VARCHAR(10);
    `);

        // access_code_type - permanent (never expires) or temporary (expires after time)
        await client.query(`
      ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS access_code_type access_code_type DEFAULT 'permanent';
    `);

        // access_code_expires_at - when temporary codes expire
        await client.query(`
      ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS access_code_expires_at TIMESTAMP WITH TIME ZONE;
    `);

        // access_code_generated_at - when the code was created
        await client.query(`
      ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS access_code_generated_at TIMESTAMP WITH TIME ZONE;
    `);

        // Create index for faster lookups
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lessons_access_code ON lessons(access_code);
    `);

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

async function down() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('Removing access code columns...');

        await client.query('DROP INDEX IF EXISTS idx_lessons_access_code');
        await client.query('ALTER TABLE lessons DROP COLUMN IF EXISTS access_code_enabled');
        await client.query('ALTER TABLE lessons DROP COLUMN IF EXISTS access_code');
        await client.query('ALTER TABLE lessons DROP COLUMN IF EXISTS access_code_type');
        await client.query('ALTER TABLE lessons DROP COLUMN IF EXISTS access_code_expires_at');
        await client.query('ALTER TABLE lessons DROP COLUMN IF EXISTS access_code_generated_at');
        await client.query('DROP TYPE IF EXISTS access_code_type');

        await client.query('COMMIT');
        console.log('Rollback completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Rollback failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migration
const command = process.argv[2];

if (command === 'down') {
    down().then(() => pool.end());
} else {
    up().then(() => pool.end());
}
