const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');
const notificationController = require('../controllers/notification.controller.js');

// Get my notifications
router.get('/', verifyToken, notificationController.getNotifications);

// Mark as read
router.put('/:id/read', verifyToken, notificationController.markAsRead);

// Mark all as read
router.put('/read-all', verifyToken, notificationController.markAllAsRead);

// Create notification (Admin only or system)
router.post('/', verifyToken, isAdmin, notificationController.createNotificationEndpoint);

module.exports = router;
