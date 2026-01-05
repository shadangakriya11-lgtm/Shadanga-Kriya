const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin, isFacilitatorOrAdmin } = require('../middleware/auth.middleware.js');
const analyticsController = require('../controllers/analytics.controller.js');

// Dashboard stats (admin)
router.get('/dashboard', verifyToken, isAdmin, analyticsController.getDashboardStats);

// Enrollment trends
router.get('/enrollments', verifyToken, isAdmin, analyticsController.getEnrollmentTrends);

// Revenue analytics
router.get('/revenue', verifyToken, isAdmin, analyticsController.getRevenueAnalytics);

// Course analytics
router.get('/course/:courseId', verifyToken, isAdmin, [
  param('courseId').isUUID().withMessage('Valid course ID required')
], validate, analyticsController.getCourseAnalytics);

// Facilitator stats
router.get('/facilitator', verifyToken, isFacilitatorOrAdmin, analyticsController.getFacilitatorStats);

// Learner stats (for self or admin viewing others)
router.get('/learner/:learnerId?', verifyToken, analyticsController.getLearnerStats);

// Monitoring stats (real-time)
router.get('/monitoring', verifyToken, isAdmin, analyticsController.getMonitoringStats);

module.exports = router;
