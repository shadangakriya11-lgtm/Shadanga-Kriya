/**
 * Shadanga Kriya - Database Migration Script
 * 
 * This script runs all pending migrations to update the database schema.
 * Safe to run multiple times - uses IF NOT EXISTS / IF EXISTS checks.
 * 
 * Usage: npm run db:migrate
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// All migrations in order
const migrations = [
  {
    name: 'add_sub_admin_role',
    description: 'Add sub_admin to user_role enum',
    sql: `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sub_admin';`
  },
  {
    name: 'add_prerequisites_columns',
    description: 'Add prerequisites columns to courses',
    sql: `
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites TEXT;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisite_course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
    `
  },
  {
    name: 'create_notifications_table',
    description: 'Create notifications table',
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        link VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    `
  },
  {
    name: 'create_admin_settings_table',
    description: 'Create admin_settings table',
    sql: `
      CREATE TABLE IF NOT EXISTS admin_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_settings_key ON admin_settings(setting_key);
    `
  },
  {
    name: 'add_security_columns',
    description: 'Add login_attempts and locked_until for account lockout',
    sql: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
    `
  },
  {
    name: 'create_password_reset_tokens',
    description: 'Create password_reset_tokens table',
    sql: `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    `
  },
  {
    name: 'fix_lesson_durations',
    description: 'Populate duration_seconds from duration_minutes',
    sql: `
      UPDATE lessons 
      SET duration_seconds = duration_minutes * 60
      WHERE (duration_seconds IS NULL OR duration_seconds = 0) AND duration_minutes > 0;
    `
  },
  {
    name: 'create_referral_codes_table',
    description: 'Create referral_codes table',
    sql: `
      CREATE TABLE IF NOT EXISTS referral_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code INTEGER NOT NULL UNIQUE,
        description TEXT,
        created_by UUID REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
      CREATE INDEX IF NOT EXISTS idx_referral_codes_created_by ON referral_codes(created_by);
    `
  },
  {
    name: 'add_referred_by_to_users',
    description: 'Add referred_by_code_id to users',
    sql: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code_id UUID REFERENCES referral_codes(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_users_referred_by_code_id ON users(referred_by_code_id);
    `
  },
  {
    name: 'grant_referral_permissions',
    description: 'Grant manage_referrals to existing facilitators and sub-admins',
    sql: `
      INSERT INTO sub_admin_permissions (user_id, permission)
      SELECT id, 'manage_referrals'
      FROM users
      WHERE role IN ('facilitator', 'sub_admin')
      AND NOT EXISTS (
        SELECT 1 FROM sub_admin_permissions 
        WHERE user_id = users.id AND permission = 'manage_referrals'
      );
    `
  }
];

async function runMigrations() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        SHADANGA KRIYA - Database Migration Script             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();

  try {
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    console.log('🔄 Running migrations...\n');

    let successCount = 0;
    let skipCount = 0;

    for (const migration of migrations) {
      try {
        console.log(`   ⏳ ${migration.name}: ${migration.description} `);
        await client.query(migration.sql);
        console.log(`   ✅ ${migration.name}: Done`);
        successCount++;
      } catch (err) {
        // Some errors are expected (e.g., enum value already exists)
        if (err.message.includes('already exists') || err.code === '42710') {
          console.log(`   ⏭️  ${migration.name}: Already applied, skipping`);
          skipCount++;
        } else {
          console.error(`   ❌ ${migration.name}: Failed - ${err.message} `);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`✅ Migrations complete: ${successCount} applied, ${skipCount} skipped`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
