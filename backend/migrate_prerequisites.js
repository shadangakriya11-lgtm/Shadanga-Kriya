require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    console.log('Connecting to database...');
    console.log('Adding prerequisites columns to courses table...');
    
    // Add prerequisites column if not exists
    await pool.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS prerequisites TEXT;
    `);
    console.log('✓ Added prerequisites column');
    
    // Add prerequisite_course_id column if not exists
    await pool.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS prerequisite_course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
    `);
    console.log('✓ Added prerequisite_course_id column');
    
    console.log('\n✅ Migration completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
