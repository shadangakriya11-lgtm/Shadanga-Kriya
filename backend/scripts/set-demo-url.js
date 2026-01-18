/**
 * Set the demo audio URL in the database
 */
require('dotenv').config();
const pool = require('../config/db.js');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const audioUrl = `https://res.cloudinary.com/${cloudName}/video/upload/shadanga-kriya/demo/demo_meditation.mp3`;

console.log('Setting demo audio URL:', audioUrl);

pool.query(`
    INSERT INTO app_settings (key, value, description, updated_at) 
    VALUES ('demo_audio_url', $1, 'URL for the demo meditation audio file', NOW()) 
    ON CONFLICT (key) 
    DO UPDATE SET value = $1, updated_at = NOW()
`, [audioUrl])
    .then(() => {
        console.log('✅ Demo audio URL saved successfully!');
        process.exit(0);
    })
    .catch(e => {
        console.error('Error:', e.message);
        process.exit(1);
    });
