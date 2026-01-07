const express = require('express');
const { query } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');
const exportController = require('../controllers/export.controller.js');

// All export routes require admin access
router.use(verifyToken, isAdmin);

// Export users
router.get('/users', [
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv')
], validate, exportController.exportUsers);

// Export enrollments
router.get('/enrollments', [
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv')
], validate, exportController.exportEnrollments);

// Export payments
router.get('/payments', [
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date')
], validate, exportController.exportPayments);

// Export attendance
router.get('/attendance', [
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
    query('sessionId').optional().isUUID().withMessage('Session ID must be valid UUID')
], validate, exportController.exportAttendance);

// Export courses
router.get('/courses', [
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv')
], validate, exportController.exportCourses);

// Export certificates
router.get('/certificates', [
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv')
], validate, exportController.exportCertificates);

module.exports = router;
