const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'therapy-lms/audio',
        resource_type: 'auto', // helper for audio files
        allowed_formats: ['mp3', 'wav', 'm4a', 'aac'],
    },
});

const upload = multer({ storage: storage });

module.exports = upload;
