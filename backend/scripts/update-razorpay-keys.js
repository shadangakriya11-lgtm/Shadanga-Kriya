const pool = require('../config/db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateRazorpayKeys() {
  try {
    console.log('\n=== Update Razorpay Keys ===\n');
    console.log('Get your keys from: https://dashboard.razorpay.com/app/keys\n');
    console.log('IMPORTANT: Both keys must be from the SAME mode (test or live)\n');

    const keyId = await question('Enter Razorpay Key ID (rzp_test_... or rzp_live_...): ');
    const secretKey = await question('Enter Razorpay Secret Key: ');

    if (!keyId || !secretKey) {
      console.log('\n❌ Both keys are required!');
      rl.close();
      process.exit(1);
    }

    // Validate key format
    if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
      console.log('\n❌ Key ID must start with rzp_test_ or rzp_live_');
      rl.close();
      process.exit(1);
    }

    const keyMode = keyId.startsWith('rzp_test_') ? 'test' : 'live';
    const secretMode = secretKey.startsWith('rzp_test_') ? 'test' : secretKey.startsWith('rzp_live_') ? 'live' : 'unknown';

    if (keyMode !== secretMode && secretMode !== 'unknown') {
      console.log('\n❌ Keys are from different modes!');
      console.log(`Key ID is ${keyMode} mode but Secret Key is ${secretMode} mode`);
      rl.close();
      process.exit(1);
    }

    console.log(`\nUpdating keys in ${keyMode} mode...`);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update or insert key_id
      await client.query(
        `INSERT INTO admin_settings (setting_key, setting_value)
         VALUES ('razorpay_key_id', $1)
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = $1, updated_at = NOW()`,
        [keyId]
      );

      // Update or insert secret_key
      await client.query(
        `INSERT INTO admin_settings (setting_key, setting_value)
         VALUES ('razorpay_secret_key', $1)
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = $1, updated_at = NOW()`,
        [secretKey]
      );

      await client.query('COMMIT');

      console.log('\n✅ Razorpay keys updated successfully!');
      console.log(`Mode: ${keyMode.toUpperCase()}`);
      console.log(`Key ID: ${keyId.substring(0, 20)}...`);
      console.log('\nYou can now test payments.\n');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error updating keys:', error.message);
    rl.close();
    process.exit(1);
  }
}

updateRazorpayKeys();
