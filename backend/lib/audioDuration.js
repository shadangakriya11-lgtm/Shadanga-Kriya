/**
 * Audio Duration Extractor
 *
 * Streams an audio file from R2/S3 and extracts its exact duration in seconds
 * using the music-metadata library.  Works with MP3, AAC, OGG, FLAC, WAV, etc.
 */

const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const mm = require('music-metadata');

// Re-use S3/R2 client from environment
const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Extract the R2 object key from a full R2 URL.
 * Handles: https://{account}.r2.cloudflarestorage.com/{bucket}/{key}
 */
const getR2KeyFromUrl = (url) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes('r2.cloudflarestorage.com')) return null;
        const pathParts = urlObj.pathname.substring(1).split('/');
        return pathParts.length > 1 ? pathParts.slice(1).join('/') : null;
    } catch {
        return null;
    }
};

/**
 * Get the exact duration (in seconds) of an audio file stored in R2.
 *
 * @param {string} audioUrl - The full R2 URL of the audio file
 * @returns {Promise<number|null>} Duration in seconds (decimal), or null on failure
 */
const getAudioDuration = async (audioUrl) => {
    const key = getR2KeyFromUrl(audioUrl);
    if (!key) {
        console.warn('[audioDuration] Not an R2 URL, skipping:', audioUrl);
        return null;
    }

    try {
        // Get file size first (music-metadata needs it for accurate VBR parsing)
        const headResp = await r2.send(
            new HeadObjectCommand({
                Bucket: process.env.R2_BUCKET_AUDIOS,
                Key: key,
            })
        );
        const fileSize = headResp.ContentLength;

        // Stream the audio from R2
        const getResp = await r2.send(
            new GetObjectCommand({
                Bucket: process.env.R2_BUCKET_AUDIOS,
                Key: key,
            })
        );

        // Parse metadata from the readable stream
        const metadata = await mm.parseStream(
            getResp.Body,
            { mimeType: headResp.ContentType || 'audio/mpeg', size: fileSize },
            { duration: true, skipCovers: true }
        );

        // Destroy the stream to free resources
        if (getResp.Body && typeof getResp.Body.destroy === 'function') {
            getResp.Body.destroy();
        }

        const duration = metadata?.format?.duration;
        if (duration && duration > 0) {
            console.log(`[audioDuration] Extracted duration: ${duration.toFixed(2)}s for key: ${key}`);
            return Math.round(duration); // round to nearest second
        }

        console.warn('[audioDuration] Could not determine duration for key:', key);
        return null;
    } catch (error) {
        console.error('[audioDuration] Failed to extract duration:', error.message);
        return null;
    }
};

module.exports = { getAudioDuration };
