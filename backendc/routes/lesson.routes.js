const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isFacilitatorOrAdmin, optionalAuth } = require('../middleware/auth.middleware.js');
const lessonController = require('../controllers/lesson.controller.js');

// Get lessons by course
router.get('/course/:courseId', [
  param('courseId').isUUID().withMessage('Valid course ID required')
], validate, optionalAuth, lessonController.getLessonsByCourse);

// Get lesson by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Valid lesson ID required')
], validate, optionalAuth, lessonController.getLessonById);

// Create lesson (admin/facilitator)
router.post('/', verifyToken, isFacilitatorOrAdmin, [
  body('courseId').isUUID().withMessage('Valid course ID required'),
  body('title').trim().notEmpty().withMessage('Title required')
], validate, lessonController.createLesson);

// Update lesson
router.put('/:id', verifyToken, isFacilitatorOrAdmin, [
  param('id').isUUID().withMessage('Valid lesson ID required')
], validate, lessonController.updateLesson);

// Delete lesson
router.delete('/:id', verifyToken, isFacilitatorOrAdmin, [
  param('id').isUUID().withMessage('Valid lesson ID required')
], validate, lessonController.deleteLesson);

// Reorder lessons
router.put('/course/:courseId/reorder', verifyToken, isFacilitatorOrAdmin, [
  param('courseId').isUUID().withMessage('Valid course ID required'),
  body('lessonIds').isArray().withMessage('Lesson IDs array required')
], validate, lessonController.reorderLessons);

module.exports = router;
