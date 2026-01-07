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

// Get learner's own attendance for a course (check if marked present today)
const getMyAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if there's a session today for this course and if user is marked present
    const result = await pool.query(
      `SELECT a.id, a.status, a.marked_at, s.id as session_id, s.title as session_title, s.scheduled_at
       FROM sessions s
       LEFT JOIN attendance a ON a.session_id = s.id AND a.user_id = $1
       WHERE s.course_id = $2 
         AND s.scheduled_at >= $3 
         AND s.scheduled_at < $4
       ORDER BY s.scheduled_at DESC
       LIMIT 1`,
      [userId, courseId, today, tomorrow]
    );

    if (result.rows.length === 0) {
      return res.json({
        hasSessionToday: false,
        isMarkedPresent: false,
        message: 'No session scheduled for today'
      });
    }

    const session = result.rows[0];
    const isMarkedPresent = session.status === 'present';

    res.json({
      hasSessionToday: true,
      sessionId: session.session_id,
      sessionTitle: session.session_title,
      scheduledAt: session.scheduled_at,
      isMarkedPresent,
      markedAt: session.marked_at,
      message: isMarkedPresent
        ? 'Attendance confirmed for today'
        : 'Please contact your facilitator to mark your attendance'
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ error: 'Failed to get attendance status' });
  }
};

// Export attendance as CSV
const exportAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get session info
    const sessionResult = await pool.query(
      `SELECT s.title, s.scheduled_at, c.title as course_title
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       WHERE s.id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Get attendance records
    const result = await pool.query(
      `SELECT a.status, a.marked_at, u.first_name, u.last_name, u.email
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.session_id = $1
       ORDER BY u.last_name, u.first_name`,
      [sessionId]
    );

    // Generate CSV
    const headers = ['Name', 'Email', 'Status', 'Marked At'];
    const csvData = result.rows.map(a => [
      `${a.first_name} ${a.last_name}`,
      a.email,
      a.status,
      a.marked_at ? new Date(a.marked_at).toLocaleString() : 'N/A'
    ]);

    const csvContent = [
      `# Attendance Report - ${session.course_title}`,
      `# Session: ${session.title}`,
      `# Date: ${new Date(session.scheduled_at).toLocaleDateString()}`,
      '',
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${sessionId}_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({ error: 'Failed to export attendance' });
  }
};

module.exports = {
  getSessionAttendance,
  addAttendee,
  markAttendance,
  bulkMarkAttendance,
  removeAttendee,
  getUserAttendanceHistory,
  getMyAttendance,
  exportAttendance
};
