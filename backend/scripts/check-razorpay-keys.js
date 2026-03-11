const pool = require('../config/db');

async function checkRazorpayKeys() {
  try {
    console.log('Checking Razorpay keys in database...\n');

    const result = await pool.query(
      `SELECT setting_key, setting_value 
       FROM admin_settings 
       WHERE setting_key IN ('razorpay_key_id', 'razorpay_secret_key')
       ORDER BY setting_key`
    );

    if (result.rows.length === 0) {
      console.log('❌ NO RAZORPAY KEYS FOUND IN DATABASE!\n');
      console.log('You need to set them in Admin Settings page at:');
      console.log('http://localhost:5173/admin/settings\n');
      console.log('Or run this script to set them manually.');
    } else {
      console.log('Found keys:\n');
      result.rows.forEach(row => {
        const value = row.setting_value;
        if (row.setting_key === 'razorpay_key_id') {
          console.log(`✓ ${row.setting_key}: ${value ? value.substring(0, 15) + '...' : 'EMPTY'}`);
          
          // Validate key format
          if (value && !value.startsWith('rzp_test_') && !value.startsWith('rzp_live_')) {
            console.log('  ⚠️  WARNING: Key ID should start with rzp_test_ or rzp_live_');
          }
        } else {
          console.log(`✓ ${row.setting_key}: ${value ? 'EXISTS (hidden)' : 'EMPTY'}`);
        }
      });

      // Check if both keys are from same mode
      const keyId = result.rows.find(r => r.setting_key === 'razorpay_key_id')?.setting_value;
      const secretKey = result.rows.find(r => r.setting_key === 'razorpay_secret_key')?.setting_value;

      if (keyId && secretKey) {
        const keyIdMode = keyId.startsWith('rzp_test_') ? 'test' : keyId.startsWith('rzp_live_') ? 'live' : 'unknown';
        const secretKeyMode = secretKey.startsWith('rzp_test_') ? 'test' : secretKey.startsWith('rzp_live_') ? 'live' : 'unknown';

        console.log(`\nKey ID Mode: ${keyIdMode}`);
        console.log(`Secret Key Mode: ${secretKeyMode}`);

        if (keyIdMode !== secretKeyMode) {
          console.log('\n❌ ERROR: Keys are from different modes! Both must be test or both must be live.');
        } else {
          console.log(`\n✓ Both keys are in ${keyIdMode} mode`);
        }
      }
    }

    console.log('\n---\n');
    console.log('To update keys, go to: http://localhost:5173/admin/settings');
    console.log('Or get your keys from: https://dashboard.razorpay.com/app/keys\n');

    process.exit(0);
  } catch (error) {
    console.error('Error checking Razorpay keys:', error);
    process.exit(1);
  }
}

checkRazorpayKeys();
