const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin, isFacilitator } = require('../middleware/auth.middleware.js');
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

// Admin route - grant extra pause to a user for a lesson
router.post('/:userId/:lessonId/grant-pause', verifyToken, isAdmin, [
  param('userId').isUUID().withMessage('Valid user ID required'),
  param('lessonId').isUUID().withMessage('Valid lesson ID required'),
  body('additionalPauses').optional().isInt({ min: 1, max: 10 }).withMessage('Additional pauses must be between 1 and 10')
], validate, progressController.grantExtraPause);

// Admin route - reset lesson progress for a user
router.post('/:userId/:lessonId/reset', verifyToken, isAdmin, [
  param('userId').isUUID().withMessage('Valid user ID required'),
  param('lessonId').isUUID().withMessage('Valid lesson ID required')
], validate, progressController.resetLessonProgress);

// Admin route - lock a lesson for a user
router.post('/:userId/:lessonId/lock', verifyToken, isAdmin, [
  param('userId').isUUID().withMessage('Valid user ID required'),
  param('lessonId').isUUID().withMessage('Valid lesson ID required')
], validate, progressController.lockLesson);

module.exports = router;
