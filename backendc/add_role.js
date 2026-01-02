require('dotenv').config();
const pool = require('./config/db');

async function updateRoleType() {
    try {
        // Add 'sub_admin' to user_role enum
        await pool.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sub_admin'");
        console.log("Successfully added 'sub_admin' to user_role enum.");
    } catch (err) {
        console.error("Error updating user_role:", err);
    } finally {
        process.exit();
    }
}

updateRoleType();
