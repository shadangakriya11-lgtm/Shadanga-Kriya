const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');
const userController = require('../controllers/user.controller.js');

// All routes require admin
router.use(verifyToken, isAdmin);

// Get all users
router.get('/', userController.getAllUsers);

// Get user stats
router.get('/stats', userController.getUserStats);

// Get user by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Valid user ID required')
], validate, userController.getUserById);

// Create user
router.post('/', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('role').isIn(['admin', 'facilitator', 'learner', 'sub_admin']).withMessage('Valid role required')
], validate, userController.createUser);

// Update user
router.put('/:id', [
  param('id').isUUID().withMessage('Valid user ID required')
], validate, userController.updateUser);

// Delete user
router.delete('/:id', [
  param('id').isUUID().withMessage('Valid user ID required')
], validate, userController.deleteUser);

module.exports = router;
