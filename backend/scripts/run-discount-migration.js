require('dotenv').config();
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running discount codes migration...');
    
    const migrationPath = path.join(__dirname, '../config/migrations/004_add_discount_codes.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✓ Discount codes tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
