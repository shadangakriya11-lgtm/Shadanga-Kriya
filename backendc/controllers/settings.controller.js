const pool = require('../config/db.js');

// Get all settings (admin only)
const getSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT setting_key, setting_value FROM admin_settings');

        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        res.json({ settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
};

// Update settings (admin only)
const updateSettings = async (req, res) => {
    try {
        const { razorpayKeyId, razorpaySecretKey, razorpayTestMode } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Upsert razorpay_key_id
            if (razorpayKeyId !== undefined) {
                await client.query(
                    `INSERT INTO admin_settings (setting_key, setting_value) 
           VALUES ($1, $2) 
           ON CONFLICT (setting_key) 
           DO UPDATE SET setting_value = $2, updated_at = NOW()`,
                    ['razorpay_key_id', razorpayKeyId]
                );
            }

            // Upsert razorpay_secret_key
            if (razorpaySecretKey !== undefined) {
                await client.query(
                    `INSERT INTO admin_settings (setting_key, setting_value) 
           VALUES ($1, $2) 
           ON CONFLICT (setting_key) 
           DO UPDATE SET setting_value = $2, updated_at = NOW()`,
                    ['razorpay_secret_key', razorpaySecretKey]
                );
            }

            // Upsert razorpay_test_mode
            if (razorpayTestMode !== undefined) {
                await client.query(
                    `INSERT INTO admin_settings (setting_key, setting_value) 
           VALUES ($1, $2) 
           ON CONFLICT (setting_key) 
           DO UPDATE SET setting_value = $2, updated_at = NOW()`,
                    ['razorpay_test_mode', razorpayTestMode ? 'true' : 'false']
                );
            }

            await client.query('COMMIT');
            res.json({ message: 'Settings updated successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};

// Get Razorpay public key (accessible to learners)
const getRazorpayKey = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT setting_value FROM admin_settings WHERE setting_key = $1',
            ['razorpay_key_id']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Razorpay key not configured' });
        }

        res.json({ keyId: result.rows[0].setting_value });
    } catch (error) {
        console.error('Get Razorpay key error:', error);
        res.status(500).json({ error: 'Failed to get Razorpay key' });
    }
};

// Helper function to get setting value
const getSetting = async (key) => {
    try {
        const result = await pool.query(
            'SELECT setting_value FROM admin_settings WHERE setting_key = $1',
            [key]
        );
        return result.rows.length > 0 ? result.rows[0].setting_value : null;
    } catch (error) {
        console.error(`Error getting setting ${key}:`, error);
        return null;
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getRazorpayKey,
    getSetting
};
