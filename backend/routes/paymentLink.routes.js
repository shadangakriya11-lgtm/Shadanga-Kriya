const express = require('express');
const router = express.Router();
const paymentLinkController = require('../controllers/paymentLink.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

// Admin only - generate payment link
router.post('/generate', verifyToken, requireRole('admin', 'sub_admin'), paymentLinkController.generatePaymentLink);

// Public routes - for payment link users
router.get('/course/:courseId', paymentLinkController.getCourseForPayment);
router.post('/process', paymentLinkController.processPaymentLinkPayment);
router.post('/verify', paymentLinkController.verifyPaymentLinkPayment);

module.exports = router;
