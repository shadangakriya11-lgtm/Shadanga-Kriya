const pool = require('../config/db.js');
const crypto = require('crypto');

// SECURITY: Encryption for sensitive settings
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || process.env.JWT_SECRET;
const ALGORITHM = 'aes-256-gcm';

const encrypt = (text) => {
    if (!text || !ENCRYPTION_KEY) return text;
    try {
        const iv = crypto.randomBytes(16);
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error('Encryption error:', error);
        return text;
    }
};

const decrypt = (encryptedText) => {
    if (!encryptedText || !ENCRYPTION_KEY || !encryptedText.includes(':')) return encryptedText;
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) return encryptedText;
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return encryptedText;
    }
};

// List of sensitive settings that should be encrypted
const SENSITIVE_KEYS = ['razorpay_secret_key', 'cloudinary_api_secret'];

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
                    // SECURITY: Encrypt sensitive values
                    const storedValue = SENSITIVE_KEYS.includes(key) ? encrypt(String(value)) : String(value);
                    await client.query(
                        `INSERT INTO admin_settings (setting_key, setting_value) 
                         VALUES ($1, $2) 
                         ON CONFLICT (setting_key) 
                         DO UPDATE SET setting_value = $2, updated_at = NOW()`,
                        [key, storedValue]
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

        const value = result.rows[0].setting_value;
        // SECURITY: Decrypt sensitive values
        return SENSITIVE_KEYS.includes(key) ? decrypt(value) : value;
    } catch (error) {
        console.error(`Error getting setting ${key}:`, error);
        return null;
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getRazorpayKey,
    getPlaybackSettings,
    getSetting
};
