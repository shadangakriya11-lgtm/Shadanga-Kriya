/**
 * PROXY DOWNLOAD ENDPOINT FOR iOS COMPATIBILITY
 * 
 * This endpoint proxies audio downloads through the backend server
 * to avoid CORS and signed URL issues on iOS devices.
 * 
 * This is a SAFE addition that won't affect existing builds because:
 * 1. It's a NEW endpoint that existing builds don't use
 * 2. The old direct-download method still works for Android
 * 3. Frontend will detect iOS and use this endpoint automatically
 */

const { GetObjectCommand } = require('@aws-sdk/client-s3');
const r2 = require('../config/r2');
const pool = require('../config/db');

/**
 * Proxy audio download for iOS devices
 * This avoids CORS and signed URL issues by streaming through backend
 */
const proxyAudioDownload = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { deviceId } = req.query;
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
            return res.status(403).json({ error: 'Device not registered' });
        }

        // Verify user has access to the lesson
        const accessCheck = await pool.query(
            `SELECT l.id, l.audio_url
             FROM lessons l
             JOIN courses c ON l.course_id = c.id
             JOIN enrollments e ON e.course_id = c.id
             WHERE l.id = $1 AND e.user_id = $2 AND e.status = 'active'`,
            [lessonId, userId]
        );

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No access to this lesson' });
        }

        const lesson = accessCheck.rows[0];

        if (!lesson.audio_url) {
            return res.status(404).json({ error: 'No audio available' });
        }

        // Extract R2 key from URL
        const audioUrl = lesson.audio_url;
        
        // R2 URL format: https://pub-xxx.r2.dev/path/to/file.mp3
        // We need to extract just the path part
        let key;
        try {
            const url = new URL(audioUrl);
            key = url.pathname.substring(1); // Remove leading slash
        } catch (e) {
            // If URL parsing fails, try simple split
            const urlParts = audioUrl.split('.r2.dev/');
            if (urlParts.length > 1) {
                key = urlParts[1];
            } else {
                // Last resort: everything after domain
                const parts = audioUrl.split('/');
                key = parts.slice(3).join('/');
            }
        }

        console.log(`[PROXY] Streaming audio for lesson ${lessonId}, key: ${key}`);

        // Get object from R2
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_AUDIOS,
            Key: key
        });

        const response = await r2.send(command);

        // Set appropriate headers for audio streaming
        res.setHeader('Content-Type', response.ContentType || 'audio/mpeg');
        res.setHeader('Content-Length', response.ContentLength);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        
        // CORS headers for iOS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        // Stream the audio data
        response.Body.pipe(res);

        // Update device last active
        await pool.query(
            `UPDATE user_devices SET last_active_at = NOW() WHERE user_id = $1 AND device_id = $2`,
            [userId, deviceId]
        );

    } catch (error) {
        console.error('Proxy download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to stream audio' });
        }
    }
};

module.exports = {
    proxyAudioDownload
};
