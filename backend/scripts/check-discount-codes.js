const pool = require('../config/db');

async function checkDiscountCodes() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('Connected to database\n');

    // Fetch all discount codes with their details
    const result = await client.query(`
      SELECT 
        dc.id,
        dc.code,
        dc.discount_percent,
        dc.expires_at,
        dc.is_active,
        dc.usage_count,
        dc.max_usage,
        dc.created_at,
        dc.updated_at,
        COUNT(DISTINCT dcc.course_id) as course_count,
        array_agg(DISTINCT c.title) FILTER (WHERE c.title IS NOT NULL) as courses
      FROM discount_codes dc
      LEFT JOIN discount_code_courses dcc ON dc.id = dcc.discount_code_id
      LEFT JOIN courses c ON dcc.course_id = c.id
      GROUP BY dc.id
      ORDER BY dc.created_at DESC
    `);

    console.log(`Found ${result.rows.length} discount code(s)\n`);
    console.log('='.repeat(80));

    if (result.rows.length === 0) {
      console.log('No discount codes found in database.');
    } else {
      result.rows.forEach((discount, index) => {
        const now = new Date();
        const expiresAt = new Date(discount.expires_at);
        const isExpired = expiresAt <= now;
        
        console.log(`\n${index + 1}. CODE: ${discount.code}`);
        console.log(`   ID: ${discount.id}`);
        console.log(`   Discount: ${discount.discount_percent}%`);
        console.log(`   Expires At: ${discount.expires_at}`);
        console.log(`   Is Active: ${discount.is_active}`);
        console.log(`   Status: ${isExpired ? 'EXPIRED' : 'ACTIVE'}`);
        console.log(`   Usage: ${discount.usage_count}${discount.max_usage ? `/${discount.max_usage}` : ' (unlimited)'}`);
        console.log(`   Courses: ${discount.course_count} (${discount.courses ? discount.courses.join(', ') : 'None'})`);
        console.log(`   Created: ${discount.created_at}`);
        console.log(`   Updated: ${discount.updated_at}`);
        console.log('   ' + '-'.repeat(76));
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`Current Server Time: ${new Date().toISOString()}`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('Error checking discount codes:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkDiscountCodes();
