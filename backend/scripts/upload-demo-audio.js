/**
 * Upload Demo MP3 to Cloudinary and update database
 * 
 * Usage: node scripts/upload-demo-audio.js
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const pool = require('../config/db.js');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const DEMO_FILE_PATH = path.join(__dirname, '../public/DEMO.mp3');

async function uploadDemoAudio() {
    console.log('🎵 Demo Audio Upload Script\n');

    // Check if file exists
    if (!fs.existsSync(DEMO_FILE_PATH)) {
        console.error('❌ Error: DEMO.mp3 not found at', DEMO_FILE_PATH);
        process.exit(1);
    }

    // Check Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('❌ Error: Cloudinary credentials not configured in .env');
        process.exit(1);
    }

    const fileStats = fs.statSync(DEMO_FILE_PATH);
    console.log(`📁 File found: DEMO.mp3 (${(fileStats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log('☁️  Uploading to Cloudinary...\n');

    try {
        // Upload to Cloudinary using upload_large for big files
        const result = await cloudinary.uploader.upload_large(DEMO_FILE_PATH, {
            resource_type: 'video',  // Cloudinary uses 'video' for audio files
            folder: 'shadanga-kriya/demo',
            public_id: 'demo_meditation',
            overwrite: true,
            // For MP3 audio specifically
            format: 'mp3',
            // Optional: Set access control
            access_mode: 'public',
            // For large files - use chunked upload
            chunk_size: 6000000 // 6MB chunks
        });

        console.log('✅ Upload successful!\n');
        console.log('📋 Raw Result:', JSON.stringify(result, null, 2));

        // Construct URL if not directly available
        let audioUrl = result.secure_url;
        if (!audioUrl && result.public_id) {
            // Construct the URL from public_id
            audioUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${result.public_id}.mp3`;
        }

        if (!audioUrl) {
            // If still no URL, construct from known public_id
            audioUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/shadanga-kriya/demo/demo_meditation.mp3`;
            console.log('⚠️  Using constructed URL based on expected public_id');
        }

        console.log('\n📋 Details:');
        console.log('   Public ID:', result.public_id || 'shadanga-kriya/demo/demo_meditation');
        console.log('   URL:', audioUrl);
        console.log('   Format:', result.format || 'mp3');
        if (result.duration) console.log('   Duration:', result.duration, 'seconds');
        if (result.bytes) console.log('   Size:', (result.bytes / 1024 / 1024).toFixed(2), 'MB');

        // Save URL to database
        console.log('\n💾 Saving URL to database...');

        await pool.query(`
            INSERT INTO app_settings (key, value, description, updated_at)
            VALUES ('demo_audio_url', $1, 'URL for the demo meditation audio file', NOW())
            ON CONFLICT (key) 
            DO UPDATE SET value = $1, updated_at = NOW()
        `, [audioUrl]);

        console.log('✅ Database updated with demo audio URL\n');

        // Delete local file
        console.log('🗑️  Deleting local file...');
        fs.unlinkSync(DEMO_FILE_PATH);
        console.log('✅ Local file deleted\n');

        console.log('═══════════════════════════════════════════');
        console.log('✨ Demo audio upload complete!');
        console.log('═══════════════════════════════════════════\n');
        console.log('🔗 Demo Audio URL:');
        console.log(audioUrl);
        console.log('\nThis URL is now saved in the database and ready to use.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Upload failed:', error.message);
        if (error.http_code) {
            console.error('   HTTP Code:', error.http_code);
        }
        process.exit(1);
    }
}

// Run the upload
uploadDemoAudio();
