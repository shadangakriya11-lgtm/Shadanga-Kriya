const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demo.controller.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');

// User routes (authenticated)
router.get('/status', verifyToken, demoController.getDemoStatus);
router.post('/questionnaire', verifyToken, demoController.submitQuestionnaire);
router.post('/decrypt', verifyToken, demoController.getDemoDecryptionKey);
router.post('/complete', verifyToken, demoController.markDemoCompleted);
router.post('/skip', verifyToken, demoController.skipDemo);
router.get('/audio-info', verifyToken, demoController.getDemoAudioInfo);

// Admin routes
router.get('/analytics', verifyToken, isAdmin, demoController.getDemoAnalytics);
router.post('/audio-url', verifyToken, isAdmin, demoController.setDemoAudioUrl);

module.exports = router;
