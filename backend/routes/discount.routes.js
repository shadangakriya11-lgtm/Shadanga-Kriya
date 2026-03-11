const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

// Admin only routes
router.post('/', verifyToken, requireRole('admin', 'sub_admin'), discountController.createDiscountCode);
router.get('/', verifyToken, requireRole('admin', 'sub_admin'), discountController.getAllDiscountCodes);
router.get('/:id', verifyToken, requireRole('admin', 'sub_admin'), discountController.getDiscountCodeById);
router.put('/:id', verifyToken, requireRole('admin', 'sub_admin'), discountController.updateDiscountCode);
router.delete('/:id', verifyToken, requireRole('admin', 'sub_admin'), discountController.deleteDiscountCode);

// Public route - no auth required for payment links
router.post('/validate', discountController.validateDiscountCode);

module.exports = router;
