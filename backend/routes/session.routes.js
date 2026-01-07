const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin, isFacilitatorOrAdmin } = require('../middleware/auth.middleware.js');
const sessionController = require('../controllers/session.controller.js');

// Learner routes (must be before :id routes to avoid conflicts)
// Get available sessions for booking (learners)
router.get('/available', verifyToken, sessionController.getAvailableSessions);

// Get my bookings (learners)
router.get('/my-bookings', verifyToken, sessionController.getMyBookings);

// Book a session (learners)
router.post('/:id/book', verifyToken, [
  param('id').isUUID().withMessage('Valid session ID required')
], validate, sessionController.bookSession);

// Cancel booking (learners)
router.delete('/:id/cancel-booking', verifyToken, [
  param('id').isUUID().withMessage('Valid session ID required')
], validate, sessionController.cancelBooking);

// Get all sessions (admin)
router.get('/', verifyToken, isAdmin, sessionController.getAllSessions);

// Get my sessions (facilitator)
router.get('/my', verifyToken, isFacilitatorOrAdmin, sessionController.getMySessions);

// Get session by ID
router.get('/:id', verifyToken, [
  param('id').isUUID().withMessage('Valid session ID required')
], validate, sessionController.getSessionById);

// Create session
router.post('/', verifyToken, isFacilitatorOrAdmin, [
  body('courseId').isUUID().withMessage('Valid course ID required'),
  body('title').trim().notEmpty().withMessage('Title required'),
  body('scheduledAt').isISO8601().withMessage('Valid date required')
], validate, sessionController.createSession);

// Update session
router.put('/:id', verifyToken, isFacilitatorOrAdmin, [
  param('id').isUUID().withMessage('Valid session ID required')
], validate, sessionController.updateSession);

// Delete session
router.delete('/:id', verifyToken, isFacilitatorOrAdmin, [
  param('id').isUUID().withMessage('Valid session ID required')
], validate, sessionController.deleteSession);

// Start session
router.post('/:id/start', verifyToken, isFacilitatorOrAdmin, [
  param('id').isUUID().withMessage('Valid session ID required')
], validate, sessionController.startSession);

// End session
router.post('/:id/end', verifyToken, isFacilitatorOrAdmin, [
  param('id').isUUID().withMessage('Valid session ID required')
], validate, sessionController.endSession);

module.exports = router;
