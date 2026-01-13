const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller.js');
const { verifyToken, isFacilitatorOrAdmin } = require('../middleware/auth.middleware.js');

// All routes require login
router.use(verifyToken);

// Create new code - all facilitators/admins can create
router.post('/generate', isFacilitatorOrAdmin, referralController.createCode);

// Get my codes - all facilitators/admins can view their own codes
router.get('/my-codes', isFacilitatorOrAdmin, referralController.getMyCodes);

// Toggle status - all facilitators/admins can toggle their own codes
router.patch('/:id/toggle', isFacilitatorOrAdmin, referralController.toggleCodeStatus);

module.exports = router;

