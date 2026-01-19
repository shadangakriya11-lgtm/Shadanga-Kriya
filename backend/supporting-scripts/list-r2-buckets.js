require('dotenv').config();
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function listBuckets() {
    console.log('Connecting to R2 with Account ID:', process.env.R2_ACCOUNT_ID);

    const r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        }
    });

    try {
        const data = await r2.send(new ListBucketsCommand({}));
        console.log('\nSuccess! Found the following buckets:');
        console.log('----------------------------------------');
        if (data.Buckets && data.Buckets.length > 0) {
            data.Buckets.forEach(bucket => {
                console.log(`- ${bucket.Name}`);
            });
        } else {
            console.log('No buckets found! Please create one in Cloudflare dashboard.');
        }
        console.log('----------------------------------------\n');
    } catch (err) {
        console.error('\nError listing buckets:', err.message);
        console.error('Full Error:', err);
    }
}

listBuckets();
