const pool = require('../config/db');

async function checkPaymentIds() {
  try {
    console.log('Checking payment IDs in database...\n');

    const result = await pool.query(
      `SELECT id, transaction_id, payment_id, status, created_at 
       FROM payments 
       ORDER BY created_at DESC 
       LIMIT 10`
    );

    console.log(`Found ${result.rows.length} recent payments:\n`);

    result.rows.forEach((payment, index) => {
      console.log(`${index + 1}. Payment ID: ${payment.id.substring(0, 8)}...`);
      console.log(`   Transaction ID (Order): ${payment.transaction_id || 'NULL'}`);
      console.log(`   Payment ID (Razorpay): ${payment.payment_id || 'NULL'}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Created: ${payment.created_at}`);
      console.log('');
    });

    // Check if any payments have payment_id
    const withPaymentId = result.rows.filter(p => p.payment_id).length;
    const withoutPaymentId = result.rows.filter(p => !p.payment_id).length;

    console.log(`Summary:`);
    console.log(`  With Razorpay Payment ID: ${withPaymentId}`);
    console.log(`  Without Razorpay Payment ID: ${withoutPaymentId}`);

    process.exit(0);
  } catch (error) {
    console.error('Error checking payment IDs:', error);
    process.exit(1);
  }
}

checkPaymentIds();
