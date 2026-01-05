const pool = require('../config/db.js');

// Get attendance for a session
const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT a.*, u.first_name, u.last_name, u.email
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.session_id = $1
       ORDER BY u.first_name, u.last_name`,
      [sessionId]
    );

    const attendance = result.rows.map(a => ({
      id: a.id,
      sessionId: a.session_id,
      userId: a.user_id,
      userName: `${a.first_name} ${a.last_name}`,
      userEmail: a.email,
      status: a.status,
      markedAt: a.marked_at,
      notes: a.notes
    }));

    // Get stats
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      pending: attendance.filter(a => a.status === 'pending').length
    };

    res.json({ attendance, stats });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to get attendance' });
  }
};

// Add attendee to session
const addAttendee = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    // Check if session exists
    const sessionCheck = await pool.query('SELECT id FROM sessions WHERE id = $1', [sessionId]);
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id, first_name, last_name FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      `INSERT INTO attendance (session_id, user_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (session_id, user_id) DO NOTHING
       RETURNING *`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User already added to session' });
    }

    res.status(201).json({
      message: 'Attendee added',
      attendance: {
        id: result.rows[0].id,
        sessionId: result.rows[0].session_id,
        userId: result.rows[0].user_id,
        userName: `${userCheck.rows[0].first_name} ${userCheck.rows[0].last_name}`,
        status: result.rows[0].status
      }
    });
  } catch (error) {
    console.error('Add attendee error:', error);
    res.status(500).json({ error: 'Failed to add attendee' });
  }
};

// Mark attendance
const markAttendance = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    const { status, notes } = req.body;

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be present or absent' });
    }

    const result = await pool.query(
      `UPDATE attendance 
       SET status = $1, marked_at = NOW(), notes = $2
       WHERE session_id = $3 AND user_id = $4
       RETURNING *`,
      [status, notes, sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({
      message: 'Attendance marked',
      attendance: {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        status: result.rows[0].status,
        markedAt: result.rows[0].marked_at
      }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// Bulk mark attendance
const bulkMarkAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { attendances } = req.body; // Array of { userId, status, notes }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const results = [];
      for (const att of attendances) {
        const result = await client.query(
          `UPDATE attendance 
           SET status = $1, marked_at = NOW(), notes = $2
           WHERE session_id = $3 AND user_id = $4
           RETURNING id, user_id, status`,
          [att.status, att.notes, sessionId, att.userId]
        );
        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      }

      await client.query('COMMIT');

      res.json({
        message: 'Attendance marked for all',
        updated: results.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// Remove attendee from session
const removeAttendee = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;

    const result = await pool.query(
      'DELETE FROM attendance WHERE session_id = $1 AND user_id = $2 RETURNING id',
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({ message: 'Attendee removed' });
  } catch (error) {
    console.error('Remove attendee error:', error);
    res.status(500).json({ error: 'Failed to remove attendee' });
  }
};

// Get user's attendance history
const getUserAttendanceHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT a.*, s.title as session_title, s.scheduled_at, c.title as course_title
       FROM attendance a
       JOIN sessions s ON a.session_id = s.id
       JOIN courses c ON s.course_id = c.id
       WHERE a.user_id = $1
       ORDER BY s.scheduled_at DESC`,
      [userId]
    );

    const history = result.rows.map(a => ({
      id: a.id,
      sessionId: a.session_id,
      sessionTitle: a.session_title,
      courseTitle: a.course_title,
      scheduledAt: a.scheduled_at,
      status: a.status,
      markedAt: a.marked_at
    }));

    const stats = {
      total: history.length,
      present: history.filter(a => a.status === 'present').length,
      absent: history.filter(a => a.status === 'absent').length,
      attendanceRate: history.length > 0 
        ? Math.round((history.filter(a => a.status === 'present').length / history.length) * 100) 
        : 0
    };

    res.json({ history, stats });
  } catch (error) {
    console.error('Get user attendance error:', error);
    res.status(500).json({ error: 'Failed to get attendance history' });
  }
};

module.exports = {
  getSessionAttendance,
  addAttendee,
  markAttendance,
  bulkMarkAttendance,
  removeAttendee,
  getUserAttendanceHistory
};
