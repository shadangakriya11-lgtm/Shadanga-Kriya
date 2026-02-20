import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, 'public/shadanga-kriya-logo.png');
const outputPath = join(__dirname, 'android/app/src/main/res/drawable/splash_logo.png');

async function resizeLogo() {
    try {
        // Simple resize to 300px, preserving aspect ratio
        await sharp(inputPath)
            .resize(300, 300, {
                fit: 'inside',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toFile(outputPath);
            
        console.log('✅ Logo resized to 300x300px');
        console.log('📱 Original logo preserved without cropping');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

resizeLogo();
