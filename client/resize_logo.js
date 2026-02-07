const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = 'public/shadanga-kriya-logo.png';
const outputPath = 'android/app/src/main/res/drawable/splash_logo.png';

async function resizeLogo() {
    try {
        // Resize to 300px width/height (high density) but "inside" to preserve aspect ratio
        // This ensures no cropping occurs
        await sharp(inputPath)
            .resize(300, 300, {
                fit: 'inside',
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .toFile(outputPath);
        console.log('Logo resized successfully without cropping!');
    } catch (error) {
        console.error('Error resizing logo:', error);
    }
}

resizeLogo();
