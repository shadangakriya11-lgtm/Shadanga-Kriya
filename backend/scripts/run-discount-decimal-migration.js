const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running discount percent decimal migration...\n');

    const migrationPath = path.join(__dirname, '../config/migrations/005_update_discount_percent_to_decimal.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');

    console.log('✅ Migration completed successfully!');
    console.log('Discount percent now supports decimal values like 52.8%\n');

    // Show current discount codes
    const result = await client.query(
      'SELECT code, discount_percent, expires_at FROM discount_codes ORDER BY created_at DESC'
    );

    if (result.rows.length > 0) {
      console.log('Current discount codes:');
      result.rows.forEach(row => {
        console.log(`  - ${row.code}: ${row.discount_percent}%`);
      });
    } else {
      console.log('No discount codes found.');
    }

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration();
