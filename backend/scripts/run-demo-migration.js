/**
 * Run Demo Feature Database Migration
 * 
 * Usage: node scripts/run-demo-migration.js
 */

require('dotenv').config();
const pool = require('../config/db.js');

async function runMigration() {
    console.log('🔄 Running Demo Feature Migration...\n');

    try {
        // Add demo columns to users table
        console.log('1. Adding demo columns to users table...');

        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS has_watched_demo BOOLEAN DEFAULT false;
        `);
        console.log('   ✅ has_watched_demo column added');

        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_watched_at TIMESTAMP WITH TIME ZONE;
        `);
        console.log('   ✅ demo_watched_at column added');

        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_skipped BOOLEAN DEFAULT false;
        `);
        console.log('   ✅ demo_skipped column added');

        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_questionnaire_responses JSONB;
        `);
        console.log('   ✅ demo_questionnaire_responses column added');

        // Create app_settings table
        console.log('\n2. Creating app_settings table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('   ✅ app_settings table created');

        // Insert default demo audio URL setting
        console.log('\n3. Inserting default demo_audio_url setting...');
        await pool.query(`
            INSERT INTO app_settings (key, value, description)
            VALUES ('demo_audio_url', '', 'URL for the demo meditation audio file')
            ON CONFLICT (key) DO NOTHING;
        `);
        console.log('   ✅ demo_audio_url setting added');

        // Create index
        console.log('\n4. Creating index for demo status queries...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_users_demo_status ON users(has_watched_demo, demo_skipped);
        `);
        console.log('   ✅ Index created');

        console.log('\n═══════════════════════════════════════════');
        console.log('✨ Demo feature migration completed successfully!');
        console.log('═══════════════════════════════════════════');
        console.log('\nNow restart your backend server and refresh the page.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
