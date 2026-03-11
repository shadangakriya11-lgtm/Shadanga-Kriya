const pool = require('../config/db.js');
const crypto = require('crypto');

// No encryption needed - Razorpay keys are safe in protected database
// Even if exposed, they only allow creating orders for YOUR account, not stealing money

// Default playback settings
const DEFAULT_PLAYBACK_SETTINGS = {
    screen_lock_enabled: 'true',           // Require screen to stay on during playback
    offline_mode_required: 'true',         // Require offline/airplane mode
    max_default_pauses: '3',               // Default max pauses per lesson
    auto_skip_on_max_pauses: 'true',       // Auto-skip lesson when max pauses reached
    auto_skip_delay_seconds: '30',         // Delay before auto-skip (seconds)
    earphone_check_enabled: 'true',        // Require earphone check before playback
    flight_mode_check_enabled: 'true',     // Require flight mode check before playback
};

// Get all settings (admin only) — secrets are withheld from the response
const getSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT setting_key, setting_value FROM admin_settings');

        const settings = {};
        result.rows.forEach(row => {
            if (row.setting_key === 'razorpay_secret_key') return; // do not expose secret
            settings[row.setting_key] = row.setting_value;
        });

        // If env overrides are present, surface non-secret values so admins see current effective config
        if (process.env.RAZORPAY_KEY_ID) {
            settings['razorpay_key_id'] = process.env.RAZORPAY_KEY_ID;
        }
        if (process.env.RAZORPAY_TEST_MODE) {
            settings['razorpay_test_mode'] = process.env.RAZORPAY_TEST_MODE;
        }

        // Apply default playback settings if not set
        for (const [key, defaultValue] of Object.entries(DEFAULT_PLAYBACK_SETTINGS)) {
            if (settings[key] === undefined) {
                settings[key] = defaultValue;
            }
        }

        res.json({ settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
};

// Update settings (admin only)
const updateSettings = async (req, res) => {
    try {
        const {
            razorpayKeyId,
            razorpaySecretKey,
            razorpayTestMode,
            // Playback settings
            screenLockEnabled,
            offlineModeRequired,
            maxDefaultPauses,
            autoSkipOnMaxPauses,
            autoSkipDelaySeconds,
            earphoneCheckEnabled,
            flightModeCheckEnabled
        } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Helper function to upsert a setting
            const upsertSetting = async (key, value) => {
                if (value !== undefined) {
                    // Store value as plain text - no encryption needed
                    await client.query(
                        `INSERT INTO admin_settings (setting_key, setting_value) 
                         VALUES ($1, $2) 
                         ON CONFLICT (setting_key) 
                         DO UPDATE SET setting_value = $2, updated_at = NOW()`,
                        [key, String(value)]
                    );
                }
            };

            // Payment settings
            await upsertSetting('razorpay_key_id', razorpayKeyId);
            await upsertSetting('razorpay_secret_key', razorpaySecretKey);
            if (razorpayTestMode !== undefined) {
                await upsertSetting('razorpay_test_mode', razorpayTestMode ? 'true' : 'false');
            }

            // Playback settings
            if (screenLockEnabled !== undefined) {
                await upsertSetting('screen_lock_enabled', screenLockEnabled ? 'true' : 'false');
            }
            if (offlineModeRequired !== undefined) {
                await upsertSetting('offline_mode_required', offlineModeRequired ? 'true' : 'false');
            }
            if (maxDefaultPauses !== undefined) {
                await upsertSetting('max_default_pauses', String(maxDefaultPauses));
            }
            if (autoSkipOnMaxPauses !== undefined) {
                await upsertSetting('auto_skip_on_max_pauses', autoSkipOnMaxPauses ? 'true' : 'false');
            }
            if (autoSkipDelaySeconds !== undefined) {
                await upsertSetting('auto_skip_delay_seconds', String(autoSkipDelaySeconds));
            }
            if (earphoneCheckEnabled !== undefined) {
                await upsertSetting('earphone_check_enabled', earphoneCheckEnabled ? 'true' : 'false');
            }
            if (flightModeCheckEnabled !== undefined) {
                await upsertSetting('flight_mode_check_enabled', flightModeCheckEnabled ? 'true' : 'false');
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
        const keyFromEnv = process.env.RAZORPAY_KEY_ID;
        if (keyFromEnv) {
            return res.json({ keyId: keyFromEnv });
        }

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

// Get playback settings (accessible to authenticated users)
const getPlaybackSettings = async (req, res) => {
    try {
        const playbackKeys = [
            'screen_lock_enabled',
            'offline_mode_required',
            'max_default_pauses',
            'auto_skip_on_max_pauses',
            'auto_skip_delay_seconds',
            'earphone_check_enabled',
            'flight_mode_check_enabled'
        ];

        const result = await pool.query(
            'SELECT setting_key, setting_value FROM admin_settings WHERE setting_key = ANY($1)',
            [playbackKeys]
        );

        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        // Apply defaults for any missing settings
        for (const [key, defaultValue] of Object.entries(DEFAULT_PLAYBACK_SETTINGS)) {
            if (settings[key] === undefined) {
                settings[key] = defaultValue;
            }
        }

        // Convert to camelCase and proper types for frontend
        res.json({
            screenLockEnabled: settings.screen_lock_enabled === 'true',
            offlineModeRequired: settings.offline_mode_required === 'true',
            maxDefaultPauses: parseInt(settings.max_default_pauses) || 3,
            autoSkipOnMaxPauses: settings.auto_skip_on_max_pauses === 'true',
            autoSkipDelaySeconds: parseInt(settings.auto_skip_delay_seconds) || 30,
            earphoneCheckEnabled: settings.earphone_check_enabled === 'true',
            flightModeCheckEnabled: settings.flight_mode_check_enabled === 'true'
        });
    } catch (error) {
        console.error('Get playback settings error:', error);
        res.status(500).json({ error: 'Failed to get playback settings' });
    }
};

// Helper function to get setting value with env override for secrets/keys
const getSetting = async (key) => {
    try {
        const overrides = {
            razorpay_secret_key: process.env.RAZORPAY_SECRET_KEY,
            razorpay_key_id: process.env.RAZORPAY_KEY_ID,
            razorpay_test_mode: process.env.RAZORPAY_TEST_MODE,
        };

        if (overrides[key] !== undefined && overrides[key] !== null) {
            return overrides[key];
        }

        const result = await pool.query(
            'SELECT setting_value FROM admin_settings WHERE setting_key = $1',
            [key]
        );

        if (result.rows.length === 0) return null;

        // Return plain text value - no decryption needed
        return result.rows[0].setting_value;
    } catch (error) {
        console.error(`Error getting setting ${key}:`, error);
        return null;
    }
};
// Get demo audio URL (admin only)
const getDemoAudioUrl = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT value FROM app_settings WHERE key = 'demo_audio_url'`
        );

        const audioUrl = result.rows.length > 0
            ? result.rows[0].value
            : '';

        res.json({ audioUrl });
    } catch (error) {
        console.error('Get demo audio URL error:', error);
        res.status(500).json({ error: 'Failed to get demo audio URL' });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getRazorpayKey,
    getPlaybackSettings,
    getSetting,
    getDemoAudioUrl
};
