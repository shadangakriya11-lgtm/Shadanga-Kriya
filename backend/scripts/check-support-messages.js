require('dotenv').config();
const pool = require('../config/db');

async function checkMessages() {
  try {
    console.log('Checking support messages in database...\n');
    
    const result = await pool.query(
      `SELECT id, name, email, subject, status, created_at 
       FROM support_messages 
       ORDER BY created_at DESC 
       LIMIT 10`
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No support messages found in database');
    } else {
      console.log(`✓ Found ${result.rows.length} support messages:\n`);
      result.rows.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.name} (${msg.email})`);
        console.log(`   Subject: ${msg.subject}`);
        console.log(`   Status: ${msg.status}`);
        console.log(`   Created: ${msg.created_at}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error checking messages:', error.message);
    process.exit(1);
  }
}

checkMessages();
