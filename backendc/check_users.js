require('dotenv').config();
const pool = require('./config/db');

async function checkUsers() {
    try {
        const res = await pool.query("UPDATE users SET status = 'active' RETURNING email, status");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUsers();
