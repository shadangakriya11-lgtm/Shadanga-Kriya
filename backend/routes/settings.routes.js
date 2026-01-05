const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');
const settingsController = require('../controllers/settings.controller.js');

// Get all settings (admin only)
router.get('/', verifyToken, isAdmin, settingsController.getSettings);

// Update settings (admin only)
router.put('/', verifyToken, isAdmin, settingsController.updateSettings);

// Get Razorpay public key (accessible to all authenticated users)
router.get('/razorpay-key', verifyToken, settingsController.getRazorpayKey);

module.exports = router;
