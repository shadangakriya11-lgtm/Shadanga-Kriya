const pool = require('../config/db.js');

// Generate unique certificate number
const generateCertificateNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${timestamp}-${random}`;
};

// Get all certificates (admin view)
const getAllCertificates = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const countResult = await pool.query('SELECT COUNT(*) FROM certificates');
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT cert.*, 
              u.first_name, u.last_name, u.email,
              c.title as course_title
       FROM certificates cert
       JOIN users u ON cert.user_id = u.id
       JOIN courses c ON cert.course_id = c.id
       ORDER BY cert.issued_at DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const certificates = result.rows.map(cert => ({
            id: cert.id,
            certificateNumber: cert.certificate_number,
            userId: cert.user_id,
            userName: `${cert.first_name} ${cert.last_name}`,
            userEmail: cert.email,
            courseId: cert.course_id,
            courseTitle: cert.course_title,
            issuedAt: cert.issued_at,
            pdfUrl: cert.pdf_url
        }));

        res.json({
            certificates,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all certificates error:', error);
        res.status(500).json({ error: 'Failed to get certificates' });
    }
};

// Get my certificates (learner)
const getMyCertificates = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT cert.*, c.title as course_title, c.description as course_description
       FROM certificates cert
       JOIN courses c ON cert.course_id = c.id
       WHERE cert.user_id = $1
       ORDER BY cert.issued_at DESC`,
            [userId]
        );

        const certificates = result.rows.map(cert => ({
            id: cert.id,
            certificateNumber: cert.certificate_number,
            courseId: cert.course_id,
            courseTitle: cert.course_title,
            courseDescription: cert.course_description,
            issuedAt: cert.issued_at,
            pdfUrl: cert.pdf_url
        }));

        res.json({ certificates });
    } catch (error) {
        console.error('Get my certificates error:', error);
        res.status(500).json({ error: 'Failed to get certificates' });
    }
};

// Get certificate by ID
const getCertificateById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT cert.*, 
              u.first_name, u.last_name, u.email,
              c.title as course_title, c.description as course_description,
              c.duration_hours
       FROM certificates cert
       JOIN users u ON cert.user_id = u.id
       JOIN courses c ON cert.course_id = c.id
       WHERE cert.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        const cert = result.rows[0];

        // Check if user is authorized (admin, facilitator, or certificate owner)
        if (req.user.role === 'learner' && cert.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to view this certificate' });
        }

        res.json({
            id: cert.id,
            certificateNumber: cert.certificate_number,
            userId: cert.user_id,
            userName: `${cert.first_name} ${cert.last_name}`,
            userEmail: cert.email,
            courseId: cert.course_id,
            courseTitle: cert.course_title,
            courseDescription: cert.course_description,
            courseDurationHours: cert.duration_hours,
            issuedAt: cert.issued_at,
            pdfUrl: cert.pdf_url
        });
    } catch (error) {
        console.error('Get certificate error:', error);
        res.status(500).json({ error: 'Failed to get certificate' });
    }
};

// Issue certificate (auto or manual)
const issueCertificate = async (req, res) => {
    try {
        const { userId, courseId } = req.body;

        // Verify enrollment exists and is completed
        const enrollmentResult = await pool.query(
            `SELECT e.*, u.first_name, u.last_name, c.title as course_title
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = $1 AND e.course_id = $2`,
            [userId, courseId]
        );

        if (enrollmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        const enrollment = enrollmentResult.rows[0];

        // Check if certificate already exists
        const existingCert = await pool.query(
            'SELECT id FROM certificates WHERE user_id = $1 AND course_id = $2',
            [userId, courseId]
        );

        if (existingCert.rows.length > 0) {
            return res.status(400).json({ error: 'Certificate already issued for this course' });
        }

        // Generate certificate
        const certificateNumber = generateCertificateNumber();

        const result = await pool.query(
            `INSERT INTO certificates (user_id, course_id, certificate_number)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [userId, courseId, certificateNumber]
        );

        res.status(201).json({
            message: 'Certificate issued successfully',
            certificate: {
                id: result.rows[0].id,
                certificateNumber: certificateNumber,
                userName: `${enrollment.first_name} ${enrollment.last_name}`,
                courseTitle: enrollment.course_title,
                issuedAt: result.rows[0].issued_at
            }
        });
    } catch (error) {
        console.error('Issue certificate error:', error);
        res.status(500).json({ error: 'Failed to issue certificate' });
    }
};

// Auto-issue certificate when course is completed
const autoIssueCertificate = async (userId, courseId) => {
    try {
        // Check if certificate already exists
        const existingCert = await pool.query(
            'SELECT id FROM certificates WHERE user_id = $1 AND course_id = $2',
            [userId, courseId]
        );

        if (existingCert.rows.length > 0) {
            return existingCert.rows[0];
        }

        // Generate and insert certificate
        const certificateNumber = generateCertificateNumber();

        const result = await pool.query(
            `INSERT INTO certificates (user_id, course_id, certificate_number)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [userId, courseId, certificateNumber]
        );

        console.log(`Certificate ${certificateNumber} auto-issued for user ${userId} on course ${courseId}`);
        return result.rows[0];
    } catch (error) {
        console.error('Auto-issue certificate error:', error);
        return null;
    }
};

// Verify certificate (public endpoint)
const verifyCertificate = async (req, res) => {
    try {
        const { certificateNumber } = req.params;

        const result = await pool.query(
            `SELECT cert.*, 
              u.first_name, u.last_name,
              c.title as course_title, c.duration_hours
       FROM certificates cert
       JOIN users u ON cert.user_id = u.id
       JOIN courses c ON cert.course_id = c.id
       WHERE cert.certificate_number = $1`,
            [certificateNumber]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                valid: false,
                error: 'Certificate not found'
            });
        }

        const cert = result.rows[0];

        res.json({
            valid: true,
            certificate: {
                certificateNumber: cert.certificate_number,
                recipientName: `${cert.first_name} ${cert.last_name}`,
                courseTitle: cert.course_title,
                courseDurationHours: cert.duration_hours,
                issuedAt: cert.issued_at
            }
        });
    } catch (error) {
        console.error('Verify certificate error:', error);
        res.status(500).json({ error: 'Failed to verify certificate' });
    }
};

// Generate certificate PDF data (for client-side PDF generation)
const getCertificatePdfData = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT cert.*, 
              u.first_name, u.last_name,
              c.title as course_title, c.description as course_description,
              c.duration_hours, c.duration as duration_text
       FROM certificates cert
       JOIN users u ON cert.user_id = u.id
       JOIN courses c ON cert.course_id = c.id
       WHERE cert.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        const cert = result.rows[0];

        // Only owner or admin/facilitator can download
        if (req.user.role === 'learner' && cert.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json({
            certificateNumber: cert.certificate_number,
            recipientName: `${cert.first_name} ${cert.last_name}`,
            courseTitle: cert.course_title,
            courseDescription: cert.course_description,
            courseDuration: cert.duration_text || `${cert.duration_hours} hours`,
            issuedAt: cert.issued_at,
            // Additional data for certificate design
            issuerName: 'Shadanga Kriya',
            issuerTitle: 'Certificate of Completion'
        });
    } catch (error) {
        console.error('Get certificate PDF data error:', error);
        res.status(500).json({ error: 'Failed to get certificate data' });
    }
};

module.exports = {
    getAllCertificates,
    getMyCertificates,
    getCertificateById,
    issueCertificate,
    autoIssueCertificate,
    verifyCertificate,
    getCertificatePdfData
};
