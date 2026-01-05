const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');
const progressController = require('../controllers/progress.controller.js');

// Get my overall progress
router.get('/my', verifyToken, progressController.getOverallProgress);

// Get course progress
router.get('/course/:courseId', verifyToken, [
  param('courseId').isUUID().withMessage('Valid course ID required')
], validate, progressController.getCourseProgress);

// Update lesson progress
router.put('/lesson/:lessonId', verifyToken, [
  param('lessonId').isUUID().withMessage('Valid lesson ID required')
], validate, progressController.updateLessonProgress);

// Admin route - get all users' progress
router.get('/all', verifyToken, isAdmin, progressController.getAllProgress);

module.exports = router;
