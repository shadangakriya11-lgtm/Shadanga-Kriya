require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query('ALTER TABLE courses ADD COLUMN apple_product_id VARCHAR(255);');
    console.log('Successfully added apple_product_id column');
  } catch (e) {
    if (e.code === '42701') {
      console.log('Column apple_product_id already exists');
    } else {
      console.error('Error adding column:', e);
    }
  } finally {
    pool.end();
  }
}

run();
