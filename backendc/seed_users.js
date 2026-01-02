require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedUsers() {
    try {
        console.log('Seeding default users...');

        const adminPass = await bcrypt.hash('admin123', 10);
        const facilitatorPass = await bcrypt.hash('facilitator123', 10);
        const learnerPass = await bcrypt.hash('learner123', 10);

        const users = [
            { email: 'admin@therapy.com', pass: adminPass, first: 'Admin', last: 'User', role: 'admin', uid: 'USR-ADMIN' },
            { email: 'facilitator@therapy.com', pass: facilitatorPass, first: 'Dr. Emily', last: 'Watson', role: 'facilitator', uid: 'USR-FACIL' },
            { email: 'sarah@example.com', pass: learnerPass, first: 'Sarah', last: 'Mitchell', role: 'learner', uid: 'USR-LEARNER' }
        ];

        for (const u of users) {
            // Upsert user
            const res = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, user_id, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        ON CONFLICT (email) 
        DO UPDATE SET password_hash = $2, role = $6
        RETURNING id
      `, [u.email, u.pass, u.first, u.last, u.uid, u.role]);

            const userId = res.rows[0].id;

            // Upsert role
            await pool.query(`
        INSERT INTO user_roles (user_id, role)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role) DO NOTHING
      `, [userId, u.role]);

            console.log(`User ${u.email} seeded successfully.`);
        }

        console.log('All users seeded.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seedUsers();
