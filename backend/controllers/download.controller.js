const pool = require('../config/db.js');
const crypto = require('crypto');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Configure Cloudflare R2 (S3 Client) for signing URLs
const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    }
});

// Helper function to extract Key from R2 URL
const getR2KeyFromUrl = (url) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        // Remove leading slash
        return urlObj.pathname.substring(1);
    } catch (e) {
        return null;
    }
};

// Secret for key derivation (should be in env)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'shadanga-kriya-audio-encryption-secret-2024';

/**
 * Generate a unique encryption key for a user+device+lesson combination
 * This key is derived deterministically so it can be regenerated
 */
const deriveEncryptionKey = (userId, deviceId, lessonId) => {
    const data = `${userId}:${deviceId}:${lessonId}:${ENCRYPTION_SECRET}`;
    // Create a 256-bit key using SHA-256
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a hash of the encryption key (stored in DB for verification)
 */
const hashKey = (key) => {
    return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Register or update a device for a user
 */
const registerDevice = async (req, res) => {
    try {
        const { deviceId, deviceName, platform } = req.body;
        const userId = req.user.id;

        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID is required' });
        }

        const result = await pool.query(
            `INSERT INTO user_devices (user_id, device_id, device_name, platform)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, device_id) 
       DO UPDATE SET 
         device_name = COALESCE($3, user_devices.device_name),
         platform = COALESCE($4, user_devices.platform),
         last_active_at = NOW(),
         is_active = true
       RETURNING *`,
            [userId, deviceId, deviceName, platform]
        );

        res.json({
            message: 'Device registered',
            device: {
                id: result.rows[0].id,
                deviceId: result.rows[0].device_id,
                deviceName: result.rows[0].device_name,
                platform: result.rows[0].platform,
                registeredAt: result.rows[0].registered_at
            }
        });
    } catch (error) {
        console.error('Register device error:', error);
        res.status(500).json({ error: 'Failed to register device' });
    }
};

/**
 * Get my registered devices
 */
const getMyDevices = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT * FROM user_devices WHERE user_id = $1 AND is_active = true ORDER BY last_active_at DESC`,
            [userId]
        );

        const devices = result.rows.map(d => ({
            id: d.id,
            deviceId: d.device_id,
            deviceName: d.device_name,
            platform: d.platform,
            registeredAt: d.registered_at,
            lastActiveAt: d.last_active_at
        }));

        res.json({ devices });
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ error: 'Failed to get devices' });
    }
};

/**
 * Request download authorization for a lesson
 * Returns the audio URL and encryption key for the device
 */
const authorizeDownload = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { deviceId } = req.body;
        const userId = req.user.id;

        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID is required' });
        }

        // Verify device is registered
        const deviceCheck = await pool.query(
            `SELECT id FROM user_devices WHERE user_id = $1 AND device_id = $2 AND is_active = true`,
            [userId, deviceId]
        );

        if (deviceCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Device not registered. Please register device first.' });
        }

        // Verify user has access to the lesson (enrolled in course)
        const accessCheck = await pool.query(
            `SELECT l.id, l.audio_url, l.title, l.duration_seconds, c.title as course_title
       FROM lessons l
       JOIN courses c ON l.course_id = c.id
       JOIN enrollments e ON e.course_id = c.id
       WHERE l.id = $1 AND e.user_id = $2 AND e.status = 'active'`,
            [lessonId, userId]
        );

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No access to this lesson. Please enroll in the course first.' });
        }

        const lesson = accessCheck.rows[0];

        if (!lesson.audio_url) {
            return res.status(404).json({ error: 'No audio available for this lesson' });
        }

        // Generate encryption key for this user+device+lesson
        const encryptionKey = deriveEncryptionKey(userId, deviceId, lessonId);
        const keyHash = hashKey(encryptionKey);

        // Record the download authorization
        await pool.query(
            `INSERT INTO offline_downloads (user_id, lesson_id, device_id, encryption_key_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, lesson_id, device_id) 
       DO UPDATE SET 
         encryption_key_hash = $4,
         downloaded_at = NOW(),
         status = 'active'
       RETURNING id`,
            [userId, lessonId, deviceId, keyHash]
        );

        // Update device last active
        await pool.query(
            `UPDATE user_devices SET last_active_at = NOW() WHERE user_id = $1 AND device_id = $2`,
            [userId, deviceId]
        );

        let audioUrl = lesson.audio_url;

        // Sign the audio URL if it's an R2 URL
        if (audioUrl) {
            const key = getR2KeyFromUrl(audioUrl);
            if (key) {
                try {
                    const command = new GetObjectCommand({
                        Bucket: process.env.R2_BUCKET_AUDIOS,
                        Key: key
                    });
                    audioUrl = await getSignedUrl(r2, command, { expiresIn: 1800 }); // Valid for 30 minutes
                } catch (e) {
                    console.error('Failed to sign download audio URL:', e);
                }
            }
        }

        res.json({
            message: 'Download authorized',
            lesson: {
                id: lesson.id,
                title: lesson.title,
                courseTitle: lesson.course_title,
                durationSeconds: lesson.duration_seconds,
                audioUrl: audioUrl
            },
            encryption: {
                key: encryptionKey,
                algorithm: 'AES-256-CBC',
                keyDerivation: 'SHA-256'
            }
        });
    } catch (error) {
        console.error('Authorize download error:', error);
        res.status(500).json({ error: 'Failed to authorize download' });
    }
};

/**
 * Confirm download completed (update file size)
 */
const confirmDownload = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { deviceId, fileSizeBytes } = req.body;
        const userId = req.user.id;

        await pool.query(
            `UPDATE offline_downloads 
       SET file_size_bytes = $1, status = 'active', last_accessed_at = NOW()
       WHERE user_id = $2 AND lesson_id = $3 AND device_id = $4`,
            [fileSizeBytes || 0, userId, lessonId, deviceId]
        );

        res.json({ message: 'Download confirmed' });
    } catch (error) {
        console.error('Confirm download error:', error);
        res.status(500).json({ error: 'Failed to confirm download' });
    }
};

/**
 * Get decryption key for offline playback
 * Verifies the device and returns the key
 */
const getDecryptionKey = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { deviceId } = req.body;
        const userId = req.user.id;

        // Verify download exists and is active
        const downloadCheck = await pool.query(
            `SELECT od.*, l.title 
       FROM offline_downloads od
       JOIN lessons l ON od.lesson_id = l.id
       WHERE od.user_id = $1 AND od.lesson_id = $2 AND od.device_id = $3 AND od.status = 'active'`,
            [userId, lessonId, deviceId]
        );

        if (downloadCheck.rows.length === 0) {
            return res.status(404).json({ error: 'No active download found for this lesson on this device' });
        }

        // Regenerate the encryption key (it's derived deterministically)
        const encryptionKey = deriveEncryptionKey(userId, deviceId, lessonId);

        // Verify key hash matches
        const keyHash = hashKey(encryptionKey);
        if (keyHash !== downloadCheck.rows[0].encryption_key_hash) {
            return res.status(403).json({ error: 'Key verification failed. Please re-download the lesson.' });
        }

        // Update last accessed
        await pool.query(
            `UPDATE offline_downloads SET last_accessed_at = NOW() WHERE user_id = $1 AND lesson_id = $2 AND device_id = $3`,
            [userId, lessonId, deviceId]
        );

        res.json({
            key: encryptionKey,
            algorithm: 'AES-256-CBC',
            lessonTitle: downloadCheck.rows[0].title
        });
    } catch (error) {
        console.error('Get decryption key error:', error);
        res.status(500).json({ error: 'Failed to get decryption key' });
    }
};

/**
 * Get my offline downloads
 */
const getMyDownloads = async (req, res) => {
    try {
        const { deviceId } = req.query;
        const userId = req.user.id;

        let query = `
      SELECT od.*, 
             l.title as lesson_title, l.duration_seconds,
             c.title as course_title, c.id as course_id
       FROM offline_downloads od
       JOIN lessons l ON od.lesson_id = l.id
       JOIN courses c ON l.course_id = c.id
       WHERE od.user_id = $1 AND od.status = 'active'
    `;
        const params = [userId];

        if (deviceId) {
            query += ` AND od.device_id = $2`;
            params.push(deviceId);
        }

        query += ` ORDER BY od.downloaded_at DESC`;

        const result = await pool.query(query, params);

        const downloads = result.rows.map(d => ({
            id: d.id,
            lessonId: d.lesson_id,
            lessonTitle: d.lesson_title,
            courseId: d.course_id,
            courseTitle: d.course_title,
            durationSeconds: d.duration_seconds,
            deviceId: d.device_id,
            fileSizeBytes: parseInt(d.file_size_bytes) || 0,
            downloadedAt: d.downloaded_at,
            lastAccessedAt: d.last_accessed_at
        }));

        res.json({ downloads });
    } catch (error) {
        console.error('Get downloads error:', error);
        res.status(500).json({ error: 'Failed to get downloads' });
    }
};

/**
 * Delete/revoke a download
 */
const deleteDownload = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { deviceId } = req.body;
        const userId = req.user.id;

        await pool.query(
            `UPDATE offline_downloads SET status = 'deleted' 
       WHERE user_id = $1 AND lesson_id = $2 AND device_id = $3`,
            [userId, lessonId, deviceId]
        );

        res.json({ message: 'Download revoked. Please delete the local file.' });
    } catch (error) {
        console.error('Delete download error:', error);
        res.status(500).json({ error: 'Failed to delete download' });
    }
};

/**
 * Admin: Revoke all downloads for a user (e.g., when account suspended)
 */
const revokeUserDownloads = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `UPDATE offline_downloads SET status = 'revoked' WHERE user_id = $1 RETURNING id`,
            [userId]
        );

        res.json({
            message: 'All downloads revoked',
            revokedCount: result.rows.length
        });
    } catch (error) {
        console.error('Revoke downloads error:', error);
        res.status(500).json({ error: 'Failed to revoke downloads' });
    }
};

/**
 * Admin: Get download stats
 */
const getDownloadStats = async (req, res) => {
    try {
        const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT lesson_id) as unique_lessons,
        COUNT(*) as total_downloads,
        SUM(file_size_bytes) as total_size_bytes
      FROM offline_downloads 
      WHERE status = 'active'
    `);

        const topLessons = await pool.query(`
      SELECT l.title, l.id, COUNT(od.id) as download_count
      FROM offline_downloads od
      JOIN lessons l ON od.lesson_id = l.id
      WHERE od.status = 'active'
      GROUP BY l.id, l.title
      ORDER BY download_count DESC
      LIMIT 10
    `);

        res.json({
            stats: {
                uniqueUsers: parseInt(stats.rows[0].unique_users) || 0,
                uniqueLessons: parseInt(stats.rows[0].unique_lessons) || 0,
                totalDownloads: parseInt(stats.rows[0].total_downloads) || 0,
                totalSizeBytes: parseInt(stats.rows[0].total_size_bytes) || 0
            },
            topLessons: topLessons.rows
        });
    } catch (error) {
        console.error('Get download stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
};

module.exports = {
    registerDevice,
    getMyDevices,
    authorizeDownload,
    confirmDownload,
    getDecryptionKey,
    getMyDownloads,
    deleteDownload,
    revokeUserDownloads,
    getDownloadStats
};
