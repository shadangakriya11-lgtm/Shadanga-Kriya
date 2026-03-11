const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

// Public route - anyone can submit a support message
router.post('/message', supportController.submitSupportMessage);

// Protected routes - require authentication
router.get('/my-messages', verifyToken, supportController.getMyMessages);

// Admin only routes
router.get('/messages', verifyToken, requireRole('admin', 'sub_admin'), supportController.getAllSupportMessages);
router.put('/messages/:id', verifyToken, requireRole('admin', 'sub_admin'), supportController.updateSupportMessage);

module.exports = router;
