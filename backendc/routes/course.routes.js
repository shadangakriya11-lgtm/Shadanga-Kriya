const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin, isFacilitatorOrAdmin, optionalAuth } = require('../middleware/auth.middleware.js');
const courseController = require('../controllers/course.controller.js');

// Public routes
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/stats', verifyToken, isAdmin, courseController.getCourseStats);
router.get('/:id', [
  param('id').isUUID().withMessage('Valid course ID required')
], validate, optionalAuth, courseController.getCourseById);

// Admin/Facilitator routes
router.post('/', verifyToken, isFacilitatorOrAdmin, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive')
], validate, courseController.createCourse);

router.put('/:id', verifyToken, isFacilitatorOrAdmin, [
  param('id').isUUID().withMessage('Valid course ID required')
], validate, courseController.updateCourse);

router.delete('/:id', verifyToken, isAdmin, [
  param('id').isUUID().withMessage('Valid course ID required')
], validate, courseController.deleteCourse);

module.exports = router;
