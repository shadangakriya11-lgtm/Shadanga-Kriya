const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');
const enrollmentController = require('../controllers/enrollment.controller.js');

// Get my enrollments (learner)
router.get('/my', verifyToken, enrollmentController.getMyEnrollments);

// Enroll in course
router.post('/', verifyToken, [
  body('courseId').isUUID().withMessage('Valid course ID required')
], validate, enrollmentController.enrollInCourse);

// Unenroll from course
router.delete('/:courseId', verifyToken, [
  param('courseId').isUUID().withMessage('Valid course ID required')
], validate, enrollmentController.unenrollFromCourse);

// Admin routes
router.get('/', verifyToken, isAdmin, enrollmentController.getAllEnrollments);
router.get('/stats', verifyToken, isAdmin, enrollmentController.getEnrollmentStats);

// Admin: Get enrollments for a specific course
router.get('/course/:courseId', verifyToken, isAdmin, [
  param('courseId').isUUID().withMessage('Valid course ID required')
], validate, enrollmentController.getEnrollmentsByCourse);

// Admin: Enroll a user in a course
router.post('/admin', verifyToken, isAdmin, [
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('courseId').isUUID().withMessage('Valid course ID required')
], validate, enrollmentController.adminEnrollUser);

// Admin: Unenroll a user from a course
router.delete('/admin/:userId/:courseId', verifyToken, isAdmin, [
  param('userId').isUUID().withMessage('Valid user ID required'),
  param('courseId').isUUID().withMessage('Valid course ID required')
], validate, enrollmentController.adminUnenrollUser);

module.exports = router;
