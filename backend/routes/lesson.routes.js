const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isFacilitatorOrAdmin, optionalAuth } = require('../middleware/auth.middleware.js');
const lessonController = require('../controllers/lesson.controller.js');
const upload = require('../middleware/upload.middleware.js');

// Get lessons by course
router.get('/course/:courseId', [
  param('courseId').isUUID().withMessage('Valid course ID required')
], validate, optionalAuth, lessonController.getLessonsByCourse);

// Get lesson by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Valid lesson ID required')
], validate, optionalAuth, lessonController.getLessonById);

// Create lesson (admin/facilitator)
router.post('/', verifyToken, isFacilitatorOrAdmin, upload.single('audio'), [
  body('courseId').isUUID().withMessage('Valid course ID required'),
  body('title').trim().notEmpty().withMessage('Title required')
], validate, lessonController.createLesson);

// Update lesson
router.put('/:id', verifyToken, isFacilitatorOrAdmin, upload.single('audio'), [
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

// ==================== ACCESS CODE ROUTES ====================

// Get access code info for a lesson (admin only)
router.get('/:lessonId/access-code', verifyToken, isFacilitatorOrAdmin, [
  param('lessonId').isUUID().withMessage('Valid lesson ID required')
], validate, lessonController.getAccessCodeInfo);

// Generate/update access code for a lesson (admin only)
router.post('/:lessonId/access-code', verifyToken, isFacilitatorOrAdmin, [
  param('lessonId').isUUID().withMessage('Valid lesson ID required'),
  body('codeType').isIn(['permanent', 'temporary']).withMessage('Code type must be "permanent" or "temporary"'),
  body('expiresInMinutes').optional().isInt({ min: 1 }).withMessage('Expiration must be at least 1 minute')
], validate, lessonController.generateAccessCode);

// Toggle access code requirement for a lesson (admin only)
router.patch('/:lessonId/access-code/toggle', verifyToken, isFacilitatorOrAdmin, [
  param('lessonId').isUUID().withMessage('Valid lesson ID required'),
  body('enabled').isBoolean().withMessage('enabled must be a boolean')
], validate, lessonController.toggleAccessCode);

// Clear access code from a lesson (admin only)
router.delete('/:lessonId/access-code', verifyToken, isFacilitatorOrAdmin, [
  param('lessonId').isUUID().withMessage('Valid lesson ID required')
], validate, lessonController.clearAccessCode);

// Verify access code for a lesson (learner)
router.post('/:lessonId/verify-access-code', verifyToken, [
  param('lessonId').isUUID().withMessage('Valid lesson ID required'),
  body('code').notEmpty().withMessage('Access code is required')
], validate, lessonController.verifyAccessCode);

module.exports = router;
