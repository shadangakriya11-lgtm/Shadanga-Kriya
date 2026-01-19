require('dotenv').config();
const { S3Client, CreateBucketCommand } = require('@aws-sdk/client-s3');

async function createBucket() {
    const bucketName = 'shadanga-audios';
    console.log(`Attempting to create bucket: '${bucketName}'...`);

    const r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        }
    });

    try {
        await r2.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`\nSuccess! Bucket '${bucketName}' created successfully.`);
    } catch (err) {
        console.error('\nError creating bucket:', err.message);
    }
}

createBucket();
