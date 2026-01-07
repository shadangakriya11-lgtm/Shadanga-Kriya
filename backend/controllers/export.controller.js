const pool = require('../config/db.js');

// Export users data
const exportUsers = async (req, res) => {
    try {
        const { format = 'json' } = req.query;

        const result = await pool.query(
            `SELECT id, email, first_name, last_name, role, status, phone, created_at, last_active
       FROM users
       ORDER BY created_at DESC`
        );

        const users = result.rows.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            role: u.role,
            status: u.status,
            phone: u.phone || '',
            createdAt: u.created_at,
            lastActive: u.last_active
        }));

        if (format === 'csv') {
            const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Status', 'Phone', 'Created At', 'Last Active'];
            const csvRows = [headers.join(',')];

            users.forEach(u => {
                csvRows.push([
                    u.id,
                    `"${u.email}"`,
                    `"${u.firstName}"`,
                    `"${u.lastName}"`,
                    u.role,
                    u.status,
                    `"${u.phone}"`,
                    u.createdAt ? new Date(u.createdAt).toISOString() : '',
                    u.lastActive ? new Date(u.lastActive).toISOString() : ''
                ].join(','));
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
            return res.send(csvRows.join('\n'));
        }

        res.json({ users, exportedAt: new Date().toISOString(), total: users.length });
    } catch (error) {
        console.error('Export users error:', error);
        res.status(500).json({ error: 'Failed to export users' });
    }
};

// Export enrollments data
const exportEnrollments = async (req, res) => {
    try {
        const { format = 'json' } = req.query;

        const result = await pool.query(
            `SELECT e.*, 
              u.email, u.first_name, u.last_name,
              c.title as course_title
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       ORDER BY e.enrolled_at DESC`
        );

        const enrollments = result.rows.map(e => ({
            id: e.id,
            userEmail: e.email,
            userName: `${e.first_name} ${e.last_name}`,
            courseTitle: e.course_title,
            status: e.status,
            progressPercent: e.progress_percent,
            enrolledAt: e.enrolled_at,
            completedAt: e.completed_at
        }));

        if (format === 'csv') {
            const headers = ['ID', 'User Email', 'User Name', 'Course', 'Status', 'Progress %', 'Enrolled At', 'Completed At'];
            const csvRows = [headers.join(',')];

            enrollments.forEach(e => {
                csvRows.push([
                    e.id,
                    `"${e.userEmail}"`,
                    `"${e.userName}"`,
                    `"${e.courseTitle}"`,
                    e.status,
                    e.progressPercent,
                    e.enrolledAt ? new Date(e.enrolledAt).toISOString() : '',
                    e.completedAt ? new Date(e.completedAt).toISOString() : ''
                ].join(','));
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=enrollments-export.csv');
            return res.send(csvRows.join('\n'));
        }

        res.json({ enrollments, exportedAt: new Date().toISOString(), total: enrollments.length });
    } catch (error) {
        console.error('Export enrollments error:', error);
        res.status(500).json({ error: 'Failed to export enrollments' });
    }
};

// Export payments data
const exportPayments = async (req, res) => {
    try {
        const { format = 'json', startDate, endDate } = req.query;

        let query = `
      SELECT p.*, 
             u.email, u.first_name, u.last_name,
             c.title as course_title
       FROM payments p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN courses c ON p.course_id = c.id
       WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;

        if (startDate) {
            query += ` AND p.created_at >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND p.created_at <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        query += ` ORDER BY p.created_at DESC`;

        const result = await pool.query(query, params);

        const payments = result.rows.map(p => ({
            id: p.id,
            userEmail: p.email,
            userName: `${p.first_name} ${p.last_name}`,
            courseTitle: p.course_title || 'N/A',
            amount: parseFloat(p.amount),
            currency: p.currency,
            status: p.status,
            paymentMethod: p.payment_method,
            transactionId: p.transaction_id,
            createdAt: p.created_at
        }));

        if (format === 'csv') {
            const headers = ['ID', 'User Email', 'User Name', 'Course', 'Amount', 'Currency', 'Status', 'Method', 'Transaction ID', 'Date'];
            const csvRows = [headers.join(',')];

            payments.forEach(p => {
                csvRows.push([
                    p.id,
                    `"${p.userEmail}"`,
                    `"${p.userName}"`,
                    `"${p.courseTitle}"`,
                    p.amount,
                    p.currency,
                    p.status,
                    p.paymentMethod || '',
                    p.transactionId || '',
                    p.createdAt ? new Date(p.createdAt).toISOString() : ''
                ].join(','));
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=payments-export.csv');
            return res.send(csvRows.join('\n'));
        }

        // Calculate totals
        const totalAmount = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);

        res.json({
            payments,
            summary: {
                total: payments.length,
                totalAmount,
                currency: 'INR'
            },
            exportedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Export payments error:', error);
        res.status(500).json({ error: 'Failed to export payments' });
    }
};

// Export attendance data
const exportAttendance = async (req, res) => {
    try {
        const { format = 'json', sessionId } = req.query;

        let query = `
      SELECT a.*, 
             u.email, u.first_name, u.last_name,
             s.title as session_title, s.scheduled_at,
             c.title as course_title
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       JOIN sessions s ON a.session_id = s.id
       JOIN courses c ON s.course_id = c.id
       WHERE 1=1
    `;
        const params = [];

        if (sessionId) {
            query += ` AND a.session_id = $1`;
            params.push(sessionId);
        }

        query += ` ORDER BY s.scheduled_at DESC, u.last_name ASC`;

        const result = await pool.query(query, params);

        const attendance = result.rows.map(a => ({
            id: a.id,
            userEmail: a.email,
            userName: `${a.first_name} ${a.last_name}`,
            sessionTitle: a.session_title,
            courseTitle: a.course_title,
            scheduledAt: a.scheduled_at,
            status: a.status,
            markedAt: a.marked_at,
            notes: a.notes
        }));

        if (format === 'csv') {
            const headers = ['ID', 'User Email', 'User Name', 'Session', 'Course', 'Scheduled At', 'Status', 'Marked At', 'Notes'];
            const csvRows = [headers.join(',')];

            attendance.forEach(a => {
                csvRows.push([
                    a.id,
                    `"${a.userEmail}"`,
                    `"${a.userName}"`,
                    `"${a.sessionTitle}"`,
                    `"${a.courseTitle}"`,
                    a.scheduledAt ? new Date(a.scheduledAt).toISOString() : '',
                    a.status,
                    a.markedAt ? new Date(a.markedAt).toISOString() : '',
                    `"${a.notes || ''}"`
                ].join(','));
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=attendance-export.csv');
            return res.send(csvRows.join('\n'));
        }

        res.json({ attendance, exportedAt: new Date().toISOString(), total: attendance.length });
    } catch (error) {
        console.error('Export attendance error:', error);
        res.status(500).json({ error: 'Failed to export attendance' });
    }
};

// Export courses data
const exportCourses = async (req, res) => {
    try {
        const { format = 'json' } = req.query;

        const result = await pool.query(
            `SELECT c.*, 
              u.first_name as creator_first_name, u.last_name as creator_last_name,
              COUNT(DISTINCT l.id) as lesson_count,
              COUNT(DISTINCT e.id) as enrollment_count
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN lessons l ON l.course_id = c.id
       LEFT JOIN enrollments e ON e.course_id = c.id
       GROUP BY c.id, u.first_name, u.last_name
       ORDER BY c.created_at DESC`
        );

        const courses = result.rows.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            type: c.type,
            status: c.status,
            category: c.category,
            price: parseFloat(c.price),
            durationHours: c.duration_hours,
            lessonCount: parseInt(c.lesson_count),
            enrollmentCount: parseInt(c.enrollment_count),
            creatorName: c.creator_first_name ? `${c.creator_first_name} ${c.creator_last_name}` : 'N/A',
            createdAt: c.created_at
        }));

        if (format === 'csv') {
            const headers = ['ID', 'Title', 'Type', 'Status', 'Category', 'Price', 'Duration (hrs)', 'Lessons', 'Enrollments', 'Creator', 'Created At'];
            const csvRows = [headers.join(',')];

            courses.forEach(c => {
                csvRows.push([
                    c.id,
                    `"${c.title}"`,
                    c.type,
                    c.status,
                    c.category || '',
                    c.price,
                    c.durationHours,
                    c.lessonCount,
                    c.enrollmentCount,
                    `"${c.creatorName}"`,
                    c.createdAt ? new Date(c.createdAt).toISOString() : ''
                ].join(','));
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=courses-export.csv');
            return res.send(csvRows.join('\n'));
        }

        res.json({ courses, exportedAt: new Date().toISOString(), total: courses.length });
    } catch (error) {
        console.error('Export courses error:', error);
        res.status(500).json({ error: 'Failed to export courses' });
    }
};

// Export certificates data
const exportCertificates = async (req, res) => {
    try {
        const { format = 'json' } = req.query;

        const result = await pool.query(
            `SELECT cert.*, 
              u.email, u.first_name, u.last_name,
              c.title as course_title
       FROM certificates cert
       JOIN users u ON cert.user_id = u.id
       JOIN courses c ON cert.course_id = c.id
       ORDER BY cert.issued_at DESC`
        );

        const certificates = result.rows.map(cert => ({
            id: cert.id,
            certificateNumber: cert.certificate_number,
            userEmail: cert.email,
            userName: `${cert.first_name} ${cert.last_name}`,
            courseTitle: cert.course_title,
            issuedAt: cert.issued_at
        }));

        if (format === 'csv') {
            const headers = ['ID', 'Certificate Number', 'User Email', 'User Name', 'Course', 'Issued At'];
            const csvRows = [headers.join(',')];

            certificates.forEach(cert => {
                csvRows.push([
                    cert.id,
                    cert.certificateNumber,
                    `"${cert.userEmail}"`,
                    `"${cert.userName}"`,
                    `"${cert.courseTitle}"`,
                    cert.issuedAt ? new Date(cert.issuedAt).toISOString() : ''
                ].join(','));
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=certificates-export.csv');
            return res.send(csvRows.join('\n'));
        }

        res.json({ certificates, exportedAt: new Date().toISOString(), total: certificates.length });
    } catch (error) {
        console.error('Export certificates error:', error);
        res.status(500).json({ error: 'Failed to export certificates' });
    }
};

module.exports = {
    exportUsers,
    exportEnrollments,
    exportPayments,
    exportAttendance,
    exportCourses,
    exportCertificates
};
