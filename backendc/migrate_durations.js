const pool = require('./config/db.js');

async function migrateDurations() {
    try {
        console.log('Updating lesson durations...');

        const result = await pool.query(`
      UPDATE lessons 
      SET duration = CASE 
          WHEN duration_minutes > 0 THEN duration_minutes || ' min' 
          ELSE '0 min' 
        END,
        duration_seconds = duration_minutes * 60
      WHERE duration IS NULL OR duration_seconds IS NULL OR duration_seconds = 0
    `);

        console.log(`Successfully updated ${result.rowCount} lessons`);
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateDurations();
