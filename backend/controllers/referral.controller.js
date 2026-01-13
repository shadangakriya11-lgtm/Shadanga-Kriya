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

module.exports = {
    createCode,
    getMyCodes,
    toggleCodeStatus
};
