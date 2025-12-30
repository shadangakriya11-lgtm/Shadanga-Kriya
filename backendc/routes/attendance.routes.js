const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin, isFacilitatorOrAdmin } = require('../middleware/auth.middleware.js');
const attendanceController = require('../controllers/attendance.controller.js');

// Get session attendance
router.get('/session/:sessionId', verifyToken, isFacilitatorOrAdmin, [
  param('sessionId').isUUID().withMessage('Valid session ID required')
], validate, attendanceController.getSessionAttendance);

// Add attendee to session
router.post('/session/:sessionId', verifyToken, isFacilitatorOrAdmin, [
  param('sessionId').isUUID().withMessage('Valid session ID required'),
  body('userId').isUUID().withMessage('Valid user ID required')
], validate, attendanceController.addAttendee);

// Mark attendance
router.put('/session/:sessionId/user/:userId', verifyToken, isFacilitatorOrAdmin, [
  param('sessionId').isUUID().withMessage('Valid session ID required'),
  param('userId').isUUID().withMessage('Valid user ID required'),
  body('status').isIn(['present', 'absent']).withMessage('Status must be present or absent')
], validate, attendanceController.markAttendance);

// Bulk mark attendance
router.put('/session/:sessionId/bulk', verifyToken, isFacilitatorOrAdmin, [
  param('sessionId').isUUID().withMessage('Valid session ID required'),
  body('attendances').isArray().withMessage('Attendances array required')
], validate, attendanceController.bulkMarkAttendance);

// Remove attendee
router.delete('/session/:sessionId/user/:userId', verifyToken, isFacilitatorOrAdmin, [
  param('sessionId').isUUID().withMessage('Valid session ID required'),
  param('userId').isUUID().withMessage('Valid user ID required')
], validate, attendanceController.removeAttendee);

// Get user attendance history (admin)
router.get('/user/:userId', verifyToken, isAdmin, [
  param('userId').isUUID().withMessage('Valid user ID required')
], validate, attendanceController.getUserAttendanceHistory);

module.exports = router;
