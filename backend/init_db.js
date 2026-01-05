require('dotenv').config();
const { readFileSync } = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database schema...\n');

        // Read the init.sql file
        const sql = readFileSync('./config/init.sql', 'utf8');

        // Execute the SQL
        await pool.query(sql);
        console.log('✅ Database schema initialized successfully!\n');

        // Verify tables were created
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log('📊 Created tables:');
        result.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
        console.error('Details:', err);
        process.exit(1);
    }
}

initializeDatabase();
