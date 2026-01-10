/**
 * Shadanga Kriya - Database Setup Script
 * 
 * This script initializes the database schema and seeds default users.
 * Run this once after setting up your PostgreSQL database.
 * 
 * Usage: npm run db:setup
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Default users to seed
const defaultUsers = [
    {
        email: 'admin@therapy.com',
        password: 'Admin@123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        userId: 'USR-ADMIN'
    },
    {
        email: 'facilitator@therapy.com',
        password: 'Facilitator@123!',
        firstName: 'Dr. Emily',
        lastName: 'Watson',
        role: 'facilitator',
        userId: 'USR-FACIL'
    },
    {
        email: 'sarah@example.com',
        password: 'Learner@123!',
        firstName: 'Sarah',
        lastName: 'Mitchell',
        role: 'learner',
        userId: 'USR-LEARNER'
    }
];

async function initializeSchema() {
    console.log('📦 Step 1: Initializing database schema...\n');

    try {
        const sql = readFileSync(join(__dirname, '..', 'config', 'init.sql'), 'utf8');
        await pool.query(sql);
        console.log('✅ Database schema initialized successfully!\n');

        const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

        console.log('📊 Created tables:');
        result.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));
        console.log('');
        return true;
    } catch (err) {
        console.error('❌ Error initializing schema:', err.message);
        return false;
    }
}

async function seedUsers() {
    console.log('👥 Step 2: Seeding default users...\n');

    try {
        for (const user of defaultUsers) {
            const passwordHash = await bcrypt.hash(user.password, 12);

            const result = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, user_id, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        ON CONFLICT (email) 
        DO UPDATE SET password_hash = $2, role = $6, first_name = $3, last_name = $4
        RETURNING id
      `, [user.email, passwordHash, user.firstName, user.lastName, user.userId, user.role]);

            const userId = result.rows[0].id;

            await pool.query(`
        INSERT INTO user_roles (user_id, role)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role) DO NOTHING
      `, [userId, user.role]);

            console.log(`   ✓ ${user.role.padEnd(12)} - ${user.email}`);
        }

        console.log('\n✅ All users seeded successfully!\n');
        return true;
    } catch (err) {
        console.error('❌ Error seeding users:', err.message);
        return false;
    }
}

async function seedSampleCourse() {
    console.log('📚 Step 3: Seeding sample course...\n');

    try {
        const existing = await pool.query('SELECT COUNT(*) FROM courses');
        if (parseInt(existing.rows[0].count) > 0) {
            console.log('   ℹ️  Courses already exist, skipping.\n');
            return true;
        }

        const courseResult = await pool.query(`
      INSERT INTO courses (title, description, price, duration_hours, type, status, category)
      VALUES (
        'Introduction to Shadanga Kriya',
        'Begin your journey with the ancient practice of Shadanga Kriya.',
        49.99, 10, 'self', 'published', 'Meditation'
      )
      RETURNING id
    `);

        const courseId = courseResult.rows[0].id;

        const lessons = [
            { title: 'Welcome & Introduction', description: 'Overview of Shadanga Kriya.', duration: 15, maxPauses: 3 },
            { title: 'Preparing Your Practice Space', description: 'Creating the ideal environment.', duration: 10, maxPauses: 2 },
            { title: 'Breath Awareness Basics', description: 'Foundation techniques.', duration: 20, maxPauses: 3 },
            { title: 'First Limb: Pratyahara', description: 'Withdrawing the senses.', duration: 25, maxPauses: 2 },
            { title: 'Guided Practice Session', description: 'Complete guided meditation.', duration: 30, maxPauses: 1 }
        ];

        for (let i = 0; i < lessons.length; i++) {
            const l = lessons[i];
            await pool.query(`
        INSERT INTO lessons (course_id, title, description, duration_minutes, duration_seconds, order_index, max_pauses)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [courseId, l.title, l.description, l.duration, l.duration * 60, i, l.maxPauses]);
        }

        console.log(`   ✓ Created course with ${lessons.length} lessons`);
        console.log('\n✅ Sample course seeded successfully!\n');
        return true;
    } catch (err) {
        console.error('❌ Error seeding course:', err.message);
        return false;
    }
}

function displayCredentials() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    🎉 SETUP COMPLETE! 🎉                       ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Default Login Credentials:');
    console.log('');
    console.log('   🔶 Admin:       admin@therapy.com / Admin@123!');
    console.log('   🟢 Facilitator: facilitator@therapy.com / Facilitator@123!');
    console.log('   🔵 Learner:     sarah@example.com / Learner@123!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚀 Start the server with: npm run dev');
    console.log('');
}

async function main() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        SHADANGA KRIYA - Database Setup Script                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful!\n');
    } catch (err) {
        console.error('❌ Cannot connect to database:', err.message);
        process.exit(1);
    }

    if (!await initializeSchema()) process.exit(1);
    if (!await seedUsers()) process.exit(1);
    if (!await seedSampleCourse()) process.exit(1);

    displayCredentials();
    await pool.end();
    process.exit(0);
}

main();
