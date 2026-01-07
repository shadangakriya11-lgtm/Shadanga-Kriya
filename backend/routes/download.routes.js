const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');
const downloadController = require('../controllers/download.controller.js');

// All routes require authentication
router.use(verifyToken);

// Device management
router.post('/devices', [
    body('deviceId').notEmpty().withMessage('Device ID required'),
    body('deviceName').optional().trim(),
    body('platform').optional().trim()
], validate, downloadController.registerDevice);

router.get('/devices', downloadController.getMyDevices);

// Download authorization
router.post('/authorize/:lessonId', [
    param('lessonId').isUUID().withMessage('Valid lesson ID required'),
    body('deviceId').notEmpty().withMessage('Device ID required')
], validate, downloadController.authorizeDownload);

// Confirm download completed
router.post('/confirm/:lessonId', [
    param('lessonId').isUUID().withMessage('Valid lesson ID required'),
    body('deviceId').notEmpty().withMessage('Device ID required'),
    body('fileSizeBytes').optional().isInt({ min: 0 })
], validate, downloadController.confirmDownload);

// Get decryption key for playback
router.post('/decrypt/:lessonId', [
    param('lessonId').isUUID().withMessage('Valid lesson ID required'),
    body('deviceId').notEmpty().withMessage('Device ID required')
], validate, downloadController.getDecryptionKey);

// Get my downloads
router.get('/my', [
    query('deviceId').optional()
], downloadController.getMyDownloads);

// Delete/revoke a download
router.delete('/:lessonId', [
    param('lessonId').isUUID().withMessage('Valid lesson ID required'),
    body('deviceId').notEmpty().withMessage('Device ID required')
], validate, downloadController.deleteDownload);

// Admin routes
router.post('/admin/revoke/:userId', isAdmin, [
    param('userId').isUUID().withMessage('Valid user ID required')
], validate, downloadController.revokeUserDownloads);

router.get('/admin/stats', isAdmin, downloadController.getDownloadStats);

module.exports = router;
