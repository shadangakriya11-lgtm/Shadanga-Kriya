const pool = require('../config/db.js');
const crypto = require('crypto');
const { S3Client, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Configure Cloudflare R2 (S3 Client)
const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    }
});

// Helper function to extract Key from R2 URL
// R2 URL format: https://{account_id}.r2.cloudflarestorage.com/{bucket}/{key}
// We need to extract just the {key} part (without bucket)
const getR2KeyFromUrl = (url) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        // Check if this is an R2 URL
        if (!urlObj.hostname.includes('r2.cloudflarestorage.com')) {
            return null;
        }
        // pathname is /{bucket}/{key}, we need to remove the bucket part
        const pathParts = urlObj.pathname.substring(1).split('/');
        // First part is the bucket name, rest is the key
        if (pathParts.length > 1) {
            // Remove bucket name (first part) and join the rest
            return pathParts.slice(1).join('/');
        }
        return null;
    } catch (e) {
        return null;
    }
};


// Secret for key derivation (should be in env)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'shadanga-kriya-audio-encryption-secret-2024';

/**
 * Generate a unique encryption key for demo audio
 * This key is derived deterministically so it can be regenerated
 */
const deriveDemoEncryptionKey = (userId, deviceId) => {
    const data = `${userId}:${deviceId}:demo:${ENCRYPTION_SECRET}`;
    // Create a 256-bit key using SHA-256
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Get demo status for logged-in user
 */
const getDemoStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT has_watched_demo, demo_watched_at, demo_skipped 
             FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            hasWatchedDemo: user.has_watched_demo || false,
            demoWatchedAt: user.demo_watched_at,
            demoSkipped: user.demo_skipped || false,
            showDemo: !user.has_watched_demo && !user.demo_skipped
        });
    } catch (error) {
        console.error('Get demo status error:', error);
        res.status(500).json({ error: 'Failed to get demo status' });
    }
};

/**
 * Submit questionnaire responses
 */
const submitQuestionnaire = async (req, res) => {
    try {
        const userId = req.user.id;
        const { responses } = req.body;

        if (!responses || typeof responses !== 'object') {
            return res.status(400).json({ error: 'Questionnaire responses are required' });
        }

        await pool.query(
            `UPDATE users 
             SET demo_questionnaire_responses = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [JSON.stringify(responses), userId]
        );

        res.json({
            message: 'Questionnaire submitted successfully',
            canProceed: true
        });
    } catch (error) {
        console.error('Submit questionnaire error:', error);
        res.status(500).json({ error: 'Failed to submit questionnaire' });
    }
};

/**
 * Get decryption key for demo audio
 * Only works if user hasn't watched demo yet
 */
const getDemoDecryptionKey = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deviceId } = req.body;

        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID is required' });
        }

        // Check if user has already watched demo - BLOCK REPLAY
        const userCheck = await pool.query(
            `SELECT has_watched_demo FROM users WHERE id = $1`,
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (userCheck.rows[0].has_watched_demo) {
            return res.status(403).json({
                error: 'Demo has already been watched. You cannot replay the demo.',
                alreadyWatched: true
            });
        }

        // Generate encryption key for demo
        const encryptionKey = deriveDemoEncryptionKey(userId, deviceId);

        // Get demo audio URL from settings or use default
        const settingsResult = await pool.query(
            `SELECT value FROM app_settings WHERE key = 'demo_audio_url'`
        );

        const demoAudioUrl = settingsResult.rows.length > 0
            ? settingsResult.rows[0].value
            : process.env.DEMO_AUDIO_URL || null;

        res.json({
            key: encryptionKey,
            algorithm: 'AES-256-CBC',
            audioUrl: demoAudioUrl,
            message: 'Demo decryption key generated'
        });
    } catch (error) {
        console.error('Get demo decryption key error:', error);
        res.status(500).json({ error: 'Failed to get demo decryption key' });
    }
};

/**
 * Mark demo as completed
 */
const markDemoCompleted = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if already watched
        const userCheck = await pool.query(
            `SELECT has_watched_demo FROM users WHERE id = $1`,
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (userCheck.rows[0].has_watched_demo) {
            return res.status(400).json({
                error: 'Demo already marked as completed',
                alreadyWatched: true
            });
        }

        await pool.query(
            `UPDATE users 
             SET has_watched_demo = true,
                 demo_watched_at = NOW(),
                 updated_at = NOW()
             WHERE id = $1`,
            [userId]
        );

        res.json({
            message: 'Demo marked as completed',
            hasWatchedDemo: true,
            demoWatchedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Mark demo completed error:', error);
        res.status(500).json({ error: 'Failed to mark demo as completed' });
    }
};

/**
 * Skip demo
 */
const skipDemo = async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            `UPDATE users 
             SET demo_skipped = true,
                 updated_at = NOW()
             WHERE id = $1`,
            [userId]
        );

        res.json({
            message: 'Demo skipped',
            demoSkipped: true
        });
    } catch (error) {
        console.error('Skip demo error:', error);
        res.status(500).json({ error: 'Failed to skip demo' });
    }
};

/**
 * Admin: Get demo analytics - questionnaire responses
 */
const getDemoAnalytics = async (req, res) => {
    try {
        // Get overall stats
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE has_watched_demo = true) as total_watched,
                COUNT(*) FILTER (WHERE demo_skipped = true) as total_skipped,
                COUNT(*) FILTER (WHERE has_watched_demo = false AND demo_skipped = false) as pending,
                COUNT(*) as total_users
            FROM users
            WHERE role = 'learner'
        `);

        // Get detailed questionnaire responses
        const responsesResult = await pool.query(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.has_watched_demo,
                u.demo_watched_at,
                u.demo_skipped,
                u.demo_questionnaire_responses,
                u.created_at
            FROM users u
            WHERE u.demo_questionnaire_responses IS NOT NULL
            ORDER BY u.created_at DESC
            LIMIT 100
        `);

        // Aggregate questionnaire statistics
        const aggregatedResponses = {};
        for (const row of responsesResult.rows) {
            if (row.demo_questionnaire_responses) {
                const responses = typeof row.demo_questionnaire_responses === 'string'
                    ? JSON.parse(row.demo_questionnaire_responses)
                    : row.demo_questionnaire_responses;

                for (const [question, answer] of Object.entries(responses)) {
                    if (!aggregatedResponses[question]) {
                        aggregatedResponses[question] = {};
                    }
                    const answerStr = String(answer);
                    aggregatedResponses[question][answerStr] =
                        (aggregatedResponses[question][answerStr] || 0) + 1;
                }
            }
        }

        res.json({
            stats: {
                totalWatched: parseInt(statsResult.rows[0].total_watched) || 0,
                totalSkipped: parseInt(statsResult.rows[0].total_skipped) || 0,
                pending: parseInt(statsResult.rows[0].pending) || 0,
                totalUsers: parseInt(statsResult.rows[0].total_users) || 0,
                completionRate: statsResult.rows[0].total_users > 0
                    ? ((parseInt(statsResult.rows[0].total_watched) / parseInt(statsResult.rows[0].total_users)) * 100).toFixed(1)
                    : 0
            },
            questionnaireStats: aggregatedResponses,
            recentResponses: responsesResult.rows.map(r => ({
                id: r.id,
                name: `${r.first_name} ${r.last_name}`,
                email: r.email,
                hasWatchedDemo: r.has_watched_demo,
                demoWatchedAt: r.demo_watched_at,
                demoSkipped: r.demo_skipped,
                responses: r.demo_questionnaire_responses,
                createdAt: r.created_at
            }))
        });
    } catch (error) {
        console.error('Get demo analytics error:', error);
        res.status(500).json({ error: 'Failed to get demo analytics' });
    }
};

/**
 * Admin: Set demo audio URL (manual URL entry)
 */
const setDemoAudioUrl = async (req, res) => {
    try {
        const { audioUrl } = req.body;

        if (!audioUrl) {
            return res.status(400).json({ error: 'Audio URL is required' });
        }

        // Get existing URL to delete old file from R2 if it's an R2 URL
        const existingResult = await pool.query(
            `SELECT value FROM app_settings WHERE key = 'demo_audio_url'`
        );

        if (existingResult.rows.length > 0) {
            const oldUrl = existingResult.rows[0].value;
            const oldKey = getR2KeyFromUrl(oldUrl);
            if (oldKey && oldKey.includes('therapy-lms/demo/')) {
                try {
                    console.log('Deleting old demo audio from R2:', oldKey);
                    await r2.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_AUDIOS,
                        Key: oldKey
                    }));
                } catch (deleteError) {
                    console.error('Failed to delete old demo audio from R2:', deleteError);
                    // Continue even if delete fails
                }
            }
        }

        // Upsert the demo audio URL setting
        await pool.query(`
            INSERT INTO app_settings (key, value, updated_at)
            VALUES ('demo_audio_url', $1, NOW())
            ON CONFLICT (key) 
            DO UPDATE SET value = $1, updated_at = NOW()
        `, [audioUrl]);

        res.json({
            message: 'Demo audio URL updated',
            audioUrl
        });
    } catch (error) {
        console.error('Set demo audio URL error:', error);
        res.status(500).json({ error: 'Failed to set demo audio URL' });
    }
};

/**
 * Admin: Upload demo audio file to R2
 * Expects multipart form data with 'audio' field
 */
const uploadDemoAudio = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        console.log('Demo audio uploaded:', JSON.stringify(req.file, null, 2));

        // Get the new URL from multer-s3
        const newAudioUrl = req.file.location;

        if (!newAudioUrl) {
            return res.status(500).json({ error: 'Failed to get uploaded file URL' });
        }

        // Get existing URL to delete old file from R2
        const existingResult = await pool.query(
            `SELECT value FROM app_settings WHERE key = 'demo_audio_url'`
        );

        if (existingResult.rows.length > 0) {
            const oldUrl = existingResult.rows[0].value;
            const oldKey = getR2KeyFromUrl(oldUrl);
            // Only delete if it's an R2 URL (contains our path structure)
            if (oldKey && oldKey.includes('therapy-lms/demo/')) {
                try {
                    console.log('Deleting old demo audio from R2:', oldKey);
                    await r2.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_AUDIOS,
                        Key: oldKey
                    }));
                } catch (deleteError) {
                    console.error('Failed to delete old demo audio from R2:', deleteError);
                    // Continue even if delete fails
                }
            }
        }

        // Save new URL to database
        await pool.query(`
            INSERT INTO app_settings (key, value, updated_at)
            VALUES ('demo_audio_url', $1, NOW())
            ON CONFLICT (key) 
            DO UPDATE SET value = $1, updated_at = NOW()
        `, [newAudioUrl]);

        res.json({
            message: 'Demo audio uploaded successfully',
            audioUrl: newAudioUrl
        });
    } catch (error) {
        console.error('Upload demo audio error:', error);
        res.status(500).json({ error: 'Failed to upload demo audio' });
    }
};

/**
 * Get demo audio info (for download) - returns presigned URL
 */
const getDemoAudioInfo = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user has already watched demo
        const userCheck = await pool.query(
            `SELECT has_watched_demo FROM users WHERE id = $1`,
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (userCheck.rows[0].has_watched_demo) {
            return res.status(403).json({
                error: 'Demo has already been watched.',
                alreadyWatched: true
            });
        }

        // Get demo audio URL from database
        const settingsResult = await pool.query(
            `SELECT value FROM app_settings WHERE key = 'demo_audio_url'`
        );

        let audioUrl = settingsResult.rows.length > 0
            ? settingsResult.rows[0].value
            : process.env.DEMO_AUDIO_URL || null;

        if (!audioUrl) {
            return res.status(404).json({ error: 'Demo audio not configured' });
        }

        // Sign the URL if it's an R2 URL (presigned URL like lessons)
        const key = getR2KeyFromUrl(audioUrl);
        if (key) {
            try {
                const command = new GetObjectCommand({
                    Bucket: process.env.R2_BUCKET_AUDIOS,
                    Key: key
                });
                // Valid for 1 hour (demo download might take time on slow connections)
                audioUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
                console.log('Demo audio presigned URL generated');
            } catch (signError) {
                console.error('Failed to sign demo audio URL:', signError);
                // Continue with original URL if signing fails
            }
        }

        res.json({
            audioUrl,
            title: 'Demo Meditation',
            description: 'यह केवल अनुभव के लिए नहीं, बल्कि परिवर्तन की शुरुआत के लिए है।'
        });
    } catch (error) {
        console.error('Get demo audio info error:', error);
        res.status(500).json({ error: 'Failed to get demo audio info' });
    }
};

module.exports = {
    getDemoStatus,
    submitQuestionnaire,
    getDemoDecryptionKey,
    markDemoCompleted,
    skipDemo,
    getDemoAnalytics,
    setDemoAudioUrl,
    uploadDemoAudio,
    getDemoAudioInfo
};
