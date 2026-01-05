/**
 * Shadanga Kriya - Database Setup Script
 * 
 * This script initializes the database schema and seeds default users.
 * Run this once after setting up your PostgreSQL database.
 * 
 * Usage: node setup_db.js
 */

require('dotenv').config();
const { readFileSync } = require('fs');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Default users to seed
const defaultUsers = [
    {
        email: 'admin@therapy.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        userId: 'USR-ADMIN'
    },
    {
        email: 'facilitator@therapy.com',
        password: 'facilitator123',
        firstName: 'Dr. Emily',
        lastName: 'Watson',
        role: 'facilitator',
        userId: 'USR-FACIL'
    },
    {
        email: 'sarah@example.com',
        password: 'learner123',
        firstName: 'Sarah',
        lastName: 'Mitchell',
        role: 'learner',
        userId: 'USR-LEARNER'
    }
];

async function initializeSchema() {
    console.log('📦 Step 1: Initializing database schema...\n');

    try {
        // Read and execute init.sql
        const sql = readFileSync('./config/init.sql', 'utf8');
        await pool.query(sql);
        console.log('✅ Database schema initialized successfully!\n');

        // List created tables
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
            // Hash password
            const passwordHash = await bcrypt.hash(user.password, 10);

            // Upsert user
            const result = await pool.query(`
                INSERT INTO users (email, password_hash, first_name, last_name, user_id, role, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'active')
                ON CONFLICT (email) 
                DO UPDATE SET 
                    password_hash = $2, 
                    role = $6,
                    first_name = $3,
                    last_name = $4
                RETURNING id
            `, [user.email, passwordHash, user.firstName, user.lastName, user.userId, user.role]);

            const userId = result.rows[0].id;

            // Upsert role in user_roles table
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
        // Check if any courses exist
        const existing = await pool.query('SELECT COUNT(*) FROM courses');
        if (parseInt(existing.rows[0].count) > 0) {
            console.log('   ℹ️  Courses already exist, skipping sample course creation.\n');
            return true;
        }

        // Create a sample course
        const courseResult = await pool.query(`
            INSERT INTO courses (title, description, price, duration_hours, type, status, category)
            VALUES (
                'Introduction to Shadanga Kriya',
                'Begin your journey with the ancient practice of Shadanga Kriya. This foundational course covers the six limbs of this transformative meditation technique.',
                49.99,
                10,
                'self',
                'published',
                'Meditation'
            )
            RETURNING id
        `);

        const courseId = courseResult.rows[0].id;

        // Create sample lessons
        const lessons = [
            { title: 'Welcome & Introduction', description: 'An overview of Shadanga Kriya and what to expect.', duration: 15, maxPauses: 3 },
            { title: 'Preparing Your Practice Space', description: 'Creating the ideal environment for meditation.', duration: 10, maxPauses: 2 },
            { title: 'Breath Awareness Basics', description: 'Foundation techniques for conscious breathing.', duration: 20, maxPauses: 3 },
            { title: 'First Limb: Pratyahara', description: 'Withdrawing the senses for inner focus.', duration: 25, maxPauses: 2 },
            { title: 'Guided Practice Session', description: 'Your first complete guided meditation session.', duration: 30, maxPauses: 1 }
        ];

        for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i];
            await pool.query(`
                INSERT INTO lessons (course_id, title, description, duration_minutes, duration_seconds, order_index, max_pauses)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [courseId, lesson.title, lesson.description, lesson.duration, lesson.duration * 60, i, lesson.maxPauses]);
        }

        console.log(`   ✓ Created course: "Introduction to Shadanga Kriya"`);
        console.log(`   ✓ Created ${lessons.length} sample lessons`);
        console.log('\n✅ Sample course seeded successfully!\n');
        return true;
    } catch (err) {
        console.error('❌ Error seeding course:', err.message);
        return false;
    }
}

async function displayCredentials() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    🎉 SETUP COMPLETE! 🎉                       ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Default Login Credentials:');
    console.log('');
    console.log('   🔶 Admin');
    console.log('      Email:    admin@therapy.com');
    console.log('      Password: admin123');
    console.log('');
    console.log('   🟢 Facilitator');
    console.log('      Email:    facilitator@therapy.com');
    console.log('      Password: facilitator123');
    console.log('');
    console.log('   🔵 Learner');
    console.log('      Email:    sarah@example.com');
    console.log('      Password: learner123');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('🚀 You can now start the server with: npm run dev');
    console.log('');
}

async function main() {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        SHADANGA KRIYA - Database Setup Script                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Check database connection
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful!\n');
    } catch (err) {
        console.error('❌ Cannot connect to database:', err.message);
        console.error('   Please check your DATABASE_URL in .env file');
        process.exit(1);
    }

    // Run setup steps
    const schemaOk = await initializeSchema();
    if (!schemaOk) process.exit(1);

    const usersOk = await seedUsers();
    if (!usersOk) process.exit(1);

    const courseOk = await seedSampleCourse();
    if (!courseOk) process.exit(1);

    // Display credentials
    displayCredentials();

    await pool.end();
    process.exit(0);
}

main();
