require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

async function debugUpload() {
    console.log('Testing raw R2 upload...');
    const r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        }
    });

    const bucket = process.env.R2_BUCKET_AUDIOS;
    const key = 'test-debug-file.txt';

    try {
        console.log(`Uploading to bucket: ${bucket}`);
        const result = await r2.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: 'Hello World! This is a test file.'
        }));

        console.log('\nUpload SUCCESS!');
        console.log('Result:', result);

        // Construct the URL manually to see what it looks like
        const manualUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${key}`;
        console.log('\nConstructed URL (Internal):', manualUrl);

        // If you have a public R2.dev URL enabled, it would be:
        // https://pub-<hash>.r2.dev/test-debug-file.txt
        console.log('\nNOTE: The internal URL above requires Authentication headers.');
        console.log('App clients (APK/Web) CANNOT download from that URL directly.');
        console.log('You need a PUBLIC domain or Worker to serve files.');

    } catch (err) {
        console.error('\nUpload FAILED:', err);
    }
}

debugUpload();
