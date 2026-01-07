/**
 * Migration: Add download-related tables
 * 
 * This migration creates the user_devices and offline_downloads tables
 * required for the offline download feature.
 * 
 * Run: node migrations/add_download_tables.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    console.log('🔄 Running migration: add_download_tables...\n');

    try {
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful!\n');

        // Create offline_downloads table
        console.log('📦 Creating offline_downloads table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS offline_downloads (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
                lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
                device_id VARCHAR(255) NOT NULL,
                encryption_key_hash VARCHAR(255) NOT NULL,
                file_size_bytes BIGINT DEFAULT 0,
                downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                expires_at TIMESTAMP WITH TIME ZONE,
                status VARCHAR(20) DEFAULT 'active',
                UNIQUE(user_id, lesson_id, device_id)
            );
        `);
        console.log('   ✓ offline_downloads table created');

        // Create user_devices table
        console.log('📦 Creating user_devices table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_devices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
                device_id VARCHAR(255) NOT NULL,
                device_name VARCHAR(255),
                platform VARCHAR(50),
                registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_active BOOLEAN DEFAULT true,
                UNIQUE(user_id, device_id)
            );
        `);
        console.log('   ✓ user_devices table created');

        // Create indexes
        console.log('📦 Creating indexes...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_offline_downloads_user_id ON offline_downloads(user_id);
            CREATE INDEX IF NOT EXISTS idx_offline_downloads_lesson_id ON offline_downloads(lesson_id);
            CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
        `);
        console.log('   ✓ Indexes created');

        // Verify tables exist
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('user_devices', 'offline_downloads')
            ORDER BY table_name;
        `);

        console.log('\n✅ Migration complete! Tables verified:');
        result.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

        console.log('\n🎉 Download feature is now ready to use!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
