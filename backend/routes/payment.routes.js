const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');
const paymentController = require('../controllers/payment.controller.js');

// Get my payments
router.get('/my', verifyToken, paymentController.getMyPayments);

// Create payment
router.post('/', verifyToken, [
  body('courseId').isUUID().withMessage('Valid course ID required'),
  body('paymentMethod').optional().trim()
], validate, paymentController.createPayment);

// Complete payment (simulate webhook)
router.post('/:paymentId/complete', verifyToken, [
  param('paymentId').isUUID().withMessage('Valid payment ID required')
], validate, paymentController.completePayment);

// Admin routes
router.get('/', verifyToken, isAdmin, paymentController.getAllPayments);
router.get('/stats', verifyToken, isAdmin, paymentController.getPaymentStats);
router.post('/:paymentId/refund', verifyToken, isAdmin, [
  param('paymentId').isUUID().withMessage('Valid payment ID required')
], validate, paymentController.refundPayment);

// Manual Activation
router.post('/activate', verifyToken, isAdmin, [
  body('userId').isUUID().withMessage('Valid User ID required'),
  body('courseId').isUUID().withMessage('Valid Course ID required')
], validate, paymentController.activateCourse);

// Razorpay routes
router.post('/create-razorpay-order', verifyToken, paymentController.createRazorpayOrder);
router.post('/verify-razorpay', verifyToken, paymentController.verifyRazorpayPayment);

module.exports = router;
