const pool = require('../config/db');

/**
 * Submit a support message
 * POST /api/support/message
 */
exports.submitSupportMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const userId = req.user?.id || null; // Optional - user might not be logged in

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      });
    }

    // Insert support message
    const result = await pool.query(
      `INSERT INTO support_messages 
        (user_id, name, email, subject, message, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') 
       RETURNING id, created_at`,
      [userId, name.trim(), email.trim(), subject.trim(), message.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.',
      messageId: result.rows[0].id,
      submittedAt: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error submitting support message:', error);
    res.status(500).json({ 
      error: 'Failed to submit support message. Please try again.' 
    });
  }
};

/**
 * Get all support messages (Admin only)
 * GET /api/support/messages
 */
exports.getAllSupportMessages = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        sm.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.user_id as user_identifier,
        resolver.first_name || ' ' || resolver.last_name as resolved_by_name
      FROM support_messages sm
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN users resolver ON sm.resolved_by = resolver.id
    `;

    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`sm.status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY sm.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM support_messages';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      messages: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching support messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch support messages' 
    });
  }
};

/**
 * Update support message status (Admin only)
 * PUT /api/support/messages/:id
 */
exports.updateSupportMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const adminId = req.user.id;

    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: pending, in_progress, resolved, closed' 
      });
    }

    const updates = [];
    const params = [id];
    let paramCount = 2;

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;

      if (status === 'resolved' || status === 'closed') {
        updates.push(`resolved_at = NOW()`);
        updates.push(`resolved_by = $${paramCount}`);
        params.push(adminId);
        paramCount++;
      }
    }

    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${paramCount}`);
      params.push(admin_notes);
      paramCount++;
    }

    updates.push('updated_at = NOW()');

    const query = `
      UPDATE support_messages 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Support message not found' 
      });
    }

    res.json({
      success: true,
      message: 'Support message updated successfully',
      supportMessage: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating support message:', error);
    res.status(500).json({ 
      error: 'Failed to update support message' 
    });
  }
};

/**
 * Get user's own support messages
 * GET /api/support/my-messages
 */
exports.getMyMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        id, subject, message, status, created_at, updated_at, resolved_at
       FROM support_messages
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      messages: result.rows
    });
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch your messages' 
    });
  }
};
