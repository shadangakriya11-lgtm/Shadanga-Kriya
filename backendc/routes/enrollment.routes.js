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

module.exports = router;
