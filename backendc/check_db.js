require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkConnection() {
    try {
        console.log('Testing database connection...');
        console.log('URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')); // masking password
        const res = await pool.query('SELECT NOW()');
        console.log('Connection successful:', res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err.message);
        if (err.code) console.error('Error Code:', err.code);
        process.exit(1);
    }
}

checkConnection();
