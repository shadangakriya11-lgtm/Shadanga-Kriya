const pool = require('../config/db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetTables() {
  try {
    console.log('\n⚠️  WARNING: This will DELETE ALL DATA from the following tables:');
    console.log('  - notifications');
    console.log('  - payments');
    console.log('  - support_messages');
    console.log('\nThis action CANNOT be undone!\n');

    const confirm = await question('Type "RESET" to confirm deletion: ');

    if (confirm !== 'RESET') {
      console.log('\n❌ Reset cancelled. No data was deleted.');
      rl.close();
      process.exit(0);
    }

    console.log('\n🔄 Starting table reset...\n');

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Count records before deletion
      const notificationsCount = await client.query('SELECT COUNT(*) FROM notifications');
      const paymentsCount = await client.query('SELECT COUNT(*) FROM payments');
      const supportMessagesCount = await client.query('SELECT COUNT(*) FROM support_messages');

      console.log(`Found ${notificationsCount.rows[0].count} notifications`);
      console.log(`Found ${paymentsCount.rows[0].count} payments`);
      console.log(`Found ${supportMessagesCount.rows[0].count} support messages\n`);

      // Delete from notifications table
      console.log('Deleting notifications...');
      await client.query('DELETE FROM notifications');
      console.log('✅ Notifications table cleared');

      // Delete from payments table
      console.log('Deleting payments...');
      await client.query('DELETE FROM payments');
      console.log('✅ Payments table cleared');

      // Delete from support_messages table
      console.log('Deleting support messages...');
      await client.query('DELETE FROM support_messages');
      console.log('✅ Support messages table cleared');

      await client.query('COMMIT');

      console.log('\n✅ Tables reset successfully!');
      console.log('\nSummary:');
      console.log(`  - Deleted ${notificationsCount.rows[0].count} notifications`);
      console.log(`  - Deleted ${paymentsCount.rows[0].count} payments`);
      console.log(`  - Deleted ${supportMessagesCount.rows[0].count} support messages\n`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error resetting tables:', error.message);
    rl.close();
    process.exit(1);
  }
}

resetTables();