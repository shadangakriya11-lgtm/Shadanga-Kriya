require('dotenv').config();
const pool = require('./config/db.js');

// Create settings table
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_settings_key ON admin_settings(setting_key);
`;

async function createTable() {
  const client = await pool.connect();
  try {
    console.log('Creating admin_settings table...');
    await client.query(createTableQuery);
    console.log('Admin settings table created successfully.');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    client.release();
    pool.end();
  }
}

createTable();
