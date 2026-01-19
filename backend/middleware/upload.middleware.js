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

const upload = multer({
    storage: multerS3({
        s3: r2,
        bucket: process.env.R2_BUCKET_AUDIOS,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // Create a unique filename: folder/timestamp-random-original
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = 'therapy-lms/audio/' + uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '-');
            cb(null, filename);
        }
    }),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    }
});

module.exports = upload;
