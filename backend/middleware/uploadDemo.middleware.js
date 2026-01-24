const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure Cloudflare R2 (S3 Client)
const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    }
});

// Demo audio upload middleware - uploads to specific demo folder
const uploadDemo = multer({
    storage: multerS3({
        s3: r2,
        bucket: process.env.R2_BUCKET_AUDIOS,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // Store demo audio with a consistent path (overwrites old file conceptually)
            // Use timestamp to ensure unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = 'therapy-lms/demo/' + uniqueSuffix + '-demo.mp3';
            cb(null, filename);
        }
    }),
    limits: {
        fileSize: 150 * 1024 * 1024, // 150MB limit for demo audio
    },
    fileFilter: function (req, file, cb) {
        // Only allow audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'), false);
        }
    }
});

module.exports = uploadDemo;
