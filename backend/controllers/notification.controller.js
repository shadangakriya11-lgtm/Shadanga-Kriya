const pool = require('../config/db.js');

// Get notifications for a user
const getNotifications = async (req, res) => {
    try {
        const { unreadOnly = 'false', limit = 20 } = req.query;
        let query = `SELECT * FROM notifications WHERE user_id = $1`;
        const params = [req.user.id];
        let paramIndex = 2;

        if (unreadOnly === 'true') {
            query += ` AND is_read = false`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
        params.push(limit);

        const result = await pool.query(query, params);

        // Get unread count
        const countResult = await pool.query(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
            [req.user.id]
        );

        res.json({
            notifications: result.rows,
            unreadCount: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};

// Mark as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Marked as read', notification: result.rows[0] });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1`,
            [req.user.id]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

// Internal helper to create notification
// Can be used by other controllers to push notifications
const createNotification = async (userId, title, message, type = 'info', link = null) => {
    try {
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
            [userId, title, message, type, link]
        );
        return true;
    } catch (error) {
        console.error('Create notification error:', error);
        return false;
    }
};

// Create notification endpoint (internal/admin use)
const createNotificationEndpoint = async (req, res) => {
    try {
        const { userId, title, message, type, link } = req.body;
        await createNotification(userId, title, message, type, link);
        res.status(201).json({ message: 'Notification created' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create notification ' });
    }
}

// Helper to notify all admins
const notifyAdmins = async (title, message, type = 'info', link = null) => {
    try {
        // Get all admin IDs
        const result = await pool.query("SELECT id FROM users WHERE role = 'admin'");
        const adminIds = result.rows.map(row => row.id);

        // Create notification for each admin
        for (const adminId of adminIds) {
            await createNotification(adminId, title, message, type, link);
        }
        return true;
    } catch (error) {
        console.error('Notify admins error:', error);
        return false;
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotificationEndpoint,
    createNotification,
    notifyAdmins
};
