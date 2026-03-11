require('dotenv').config();
const pool = require('../config/db');

async function testAPI() {
  try {
    console.log('Testing support messages API query...\n');
    
    // This is the exact query used in the controller
    const query = `
      SELECT 
        sm.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.user_id as user_identifier,
        resolver.first_name || ' ' || resolver.last_name as resolved_by_name
      FROM support_messages sm
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN users resolver ON sm.resolved_by = resolver.id
      ORDER BY sm.created_at DESC LIMIT 50 OFFSET 0
    `;
    
    const result = await pool.query(query);
    
    console.log(`✓ Query executed successfully`);
    console.log(`✓ Found ${result.rows.length} messages\n`);
    
    if (result.rows.length > 0) {
      console.log('Sample message:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAPI();
