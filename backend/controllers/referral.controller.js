const pool = require('../config/db.js');

// Generate a random 6-digit code
const generateUniqueCode = async () => {
    let isUnique = false;
    let code;

    // Try up to 5 times to generate a unique code
    for (let i = 0; i < 5; i++) {
        code = Math.floor(100000 + Math.random() * 900000); // 100000 to 999999

        const existing = await pool.query(
            'SELECT id FROM referral_codes WHERE code = $1',
            [code]
        );

        if (existing.rows.length === 0) {
            isUnique = true;
            break;
        }
    }

    if (!isUnique) {
        throw new Error('Failed to generate unique code after multiple attempts');
    }

    return code;
};

// Create a new referral code
const createCode = async (req, res) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        // Check permissions
        if (!['admin', 'facilitator', 'sub_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized to create referral codes' });
        }

        const code = await generateUniqueCode();

        const result = await pool.query(
            `INSERT INTO referral_codes (code, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, code, description, created_at, is_active`,
            [code, description, req.user.id]
        );

        const row = result.rows[0];
        res.status(201).json({
            message: 'Referral code created successfully',
            referralCode: {
                id: row.id,
                code: row.code,
                description: row.description,
                isActive: row.is_active,
                createdAt: row.created_at,
                useCount: 0
            }
        });

    } catch (error) {
        console.error('Create referral code error:', error);
        res.status(500).json({ error: 'Failed to create referral code' });
    }
};

// Get codes created by the current user
const getMyCodes = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, code, description, is_active, created_at,
        (SELECT COUNT(*) FROM users WHERE referred_by_code_id = referral_codes.id) as use_count
       FROM referral_codes
       WHERE created_by = $1
       ORDER BY created_at DESC`,
            [req.user.id]
        );

        // Map snake_case to camelCase for frontend
        const codes = result.rows.map(row => ({
            id: row.id,
            code: row.code,
            description: row.description,
            isActive: row.is_active,
            createdAt: row.created_at,
            useCount: parseInt(row.use_count, 10) || 0
        }));

        res.json(codes);
    } catch (error) {
        console.error('Get my codes error:', error);
        res.status(500).json({ error: 'Failed to fetch referral codes' });
    }
};

// Toggle code status
const toggleCodeStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE referral_codes 
       SET is_active = NOT is_active 
       WHERE id = $1 AND created_by = $2
       RETURNING id, is_active`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Referral code not found' });
        }

        res.json({
            message: 'Status updated',
            isActive: result.rows[0].is_active
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

// Admin: Get referral analytics by facilitator/sub_admin
const getAdminAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, facilitatorId } = req.query;

        // Build date filter for user registration (when they were referred)
        let dateFilter = '';
        const params = [];
        let paramIndex = 1;

        if (startDate) {
            dateFilter += ` AND u.created_at >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            dateFilter += ` AND u.created_at <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        // Optional filter by specific facilitator
        let facilitatorFilter = '';
        if (facilitatorId) {
            facilitatorFilter = ` AND rc.created_by = $${paramIndex}`;
            params.push(facilitatorId);
            paramIndex++;
        }

        // Query to get referral statistics grouped by facilitator/sub_admin
        const analyticsQuery = `
            SELECT 
                f.id as facilitator_id,
                f.first_name,
                f.last_name,
                f.email,
                f.role,
                COUNT(DISTINCT u.id) as total_referred_users,
                COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN u.id END) as paid_users,
                COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_revenue,
                COUNT(DISTINCT rc.id) as total_codes_created
            FROM users f
            INNER JOIN referral_codes rc ON rc.created_by = f.id
            LEFT JOIN users u ON u.referred_by_code_id = rc.id ${dateFilter}
            LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'completed'
            WHERE f.role IN ('facilitator', 'sub_admin', 'admin')
            ${facilitatorFilter}
            GROUP BY f.id, f.first_name, f.last_name, f.email, f.role
            ORDER BY total_referred_users DESC
        `;

        const result = await pool.query(analyticsQuery, params);

        // Map to camelCase
        const analytics = result.rows.map(row => ({
            facilitatorId: row.facilitator_id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            role: row.role,
            totalReferredUsers: parseInt(row.total_referred_users, 10) || 0,
            paidUsers: parseInt(row.paid_users, 10) || 0,
            totalRevenue: parseFloat(row.total_revenue) || 0,
            totalCodesCreated: parseInt(row.total_codes_created, 10) || 0,
            conversionRate: row.total_referred_users > 0
                ? Math.round((row.paid_users / row.total_referred_users) * 100)
                : 0
        }));

        // Calculate summary totals
        const summary = {
            totalFacilitators: analytics.length,
            totalReferredUsers: analytics.reduce((sum, a) => sum + a.totalReferredUsers, 0),
            totalPaidUsers: analytics.reduce((sum, a) => sum + a.paidUsers, 0),
            totalRevenue: analytics.reduce((sum, a) => sum + a.totalRevenue, 0),
            overallConversionRate: analytics.reduce((sum, a) => sum + a.totalReferredUsers, 0) > 0
                ? Math.round((analytics.reduce((sum, a) => sum + a.paidUsers, 0) /
                    analytics.reduce((sum, a) => sum + a.totalReferredUsers, 0)) * 100)
                : 0
        };

        res.json({ analytics, summary });
    } catch (error) {
        console.error('Get admin referral analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch referral analytics' });
    }
};

// Admin: Get detailed referred users by a specific facilitator
const getReferredUsersByFacilitator = async (req, res) => {
    try {
        const { facilitatorId } = req.params;
        const { startDate, endDate } = req.query;

        let dateFilter = '';
        const params = [facilitatorId];
        let paramIndex = 2;

        if (startDate) {
            dateFilter += ` AND u.created_at >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            dateFilter += ` AND u.created_at <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        const query = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.created_at as registered_at,
                rc.code as referral_code,
                rc.description as code_description,
                COALESCE(
                    (SELECT SUM(amount) FROM payments WHERE user_id = u.id AND status = 'completed'),
                    0
                ) as total_paid,
                EXISTS(SELECT 1 FROM payments WHERE user_id = u.id AND status = 'completed') as has_paid
            FROM users u
            INNER JOIN referral_codes rc ON u.referred_by_code_id = rc.id
            WHERE rc.created_by = $1 ${dateFilter}
            ORDER BY u.created_at DESC
        `;

        const result = await pool.query(query, params);

        const users = result.rows.map(row => ({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            registeredAt: row.registered_at,
            referralCode: row.referral_code,
            codeDescription: row.code_description,
            totalPaid: parseFloat(row.total_paid) || 0,
            hasPaid: row.has_paid
        }));

        res.json({ users });
    } catch (error) {
        console.error('Get referred users error:', error);
        res.status(500).json({ error: 'Failed to fetch referred users' });
    }
};

module.exports = {
    createCode,
    getMyCodes,
    toggleCodeStatus,
    getAdminAnalytics,
    getReferredUsersByFacilitator
};
