require('dotenv').config();
const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');

async function configureCors() {
    console.log('Connecting to R2 with Account ID:', process.env.R2_ACCOUNT_ID);

    const r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        }
    });

    const bucketName = process.env.R2_BUCKET_AUDIOS;

    try {
        console.log(`Checking CORS for bucket: ${bucketName}...`);
        try {
            const currentCors = await r2.send(new GetBucketCorsCommand({ Bucket: bucketName }));
            console.log('Current CORS:', JSON.stringify(currentCors, null, 2));
        } catch (e) {
            console.log('No CORS policy found (or error fetching it). Setting new policy...');
        }

        console.log('\nApplying NEW CORS Policy...');
        const corsParams = {
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
                        AllowedOrigins: ["*"], // Allow ALL origins (Mobile App, Localhost, Web)
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3000
                    }
                ]
            }
        };

        await r2.send(new PutBucketCorsCommand(corsParams));
        console.log('✅ CORS Policy successfully applied!');
        console.log('Your APK should now be able to fetch files without "Failed to fetch" errors.');

    } catch (err) {
        console.error('\n❌ Error configuring CORS:', err.message);
        console.error('Full Error:', err);
    }
}

configureCors();
