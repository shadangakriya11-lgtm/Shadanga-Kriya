const pool = require('../config/db.js');

// Get all sessions
const getAllSessions = async (req, res) => {
  try {
    const { status, facilitatorId, courseId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, 
             c.title as course_title,
             u.first_name as facilitator_first_name,
             u.last_name as facilitator_last_name,
             COUNT(DISTINCT a.id) as participant_count
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN users u ON s.facilitator_id = u.id
       LEFT JOIN attendance a ON a.session_id = s.id
       WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (facilitatorId) {
      query += ` AND s.facilitator_id = $${paramIndex}`;
      params.push(facilitatorId);
      paramIndex++;
    }

    if (courseId) {
      query += ` AND s.course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    query += ` GROUP BY s.id, c.title, u.first_name, u.last_name`;

    // Get count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM (${query}) as subquery`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY s.scheduled_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const sessions = result.rows.map(s => ({
      id: s.id,
      courseId: s.course_id,
      courseTitle: s.course_title,
      facilitatorId: s.facilitator_id,
      facilitatorName: s.facilitator_first_name ? `${s.facilitator_first_name} ${s.facilitator_last_name}` : null,
      title: s.title,
      description: s.description,
      scheduledAt: s.scheduled_at,
      durationMinutes: s.duration_minutes,
      location: s.location,
      maxParticipants: s.max_participants,
      participantCount: parseInt(s.participant_count),
      status: s.status,
      createdAt: s.created_at
    }));

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};

// Get facilitator's sessions
const getMySessions = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT s.*, 
             c.title as course_title,
             COUNT(DISTINCT a.id) as participant_count
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN attendance a ON a.session_id = s.id
       WHERE s.facilitator_id = $1
    `;
    const params = [req.user.id];

    if (status) {
      query += ` AND s.status = $2`;
      params.push(status);
    }

    query += ` GROUP BY s.id, c.title ORDER BY s.scheduled_at DESC`;

    const result = await pool.query(query, params);

    const sessions = result.rows.map(s => ({
      id: s.id,
      courseId: s.course_id,
      courseTitle: s.course_title,
      title: s.title,
      description: s.description,
      scheduledAt: s.scheduled_at,
      durationMinutes: s.duration_minutes,
      location: s.location,
      maxParticipants: s.max_participants,
      participantCount: parseInt(s.participant_count),
      status: s.status
    }));

    res.json({ sessions });
  } catch (error) {
    console.error('Get my sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};

// Get session by ID
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT s.*, 
              c.title as course_title,
              u.first_name as facilitator_first_name,
              u.last_name as facilitator_last_name
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN users u ON s.facilitator_id = u.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const s = result.rows[0];

    // Get participants
    const participantsResult = await pool.query(
      `SELECT a.*, u.first_name, u.last_name, u.email
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.session_id = $1`,
      [id]
    );

    res.json({
      id: s.id,
      courseId: s.course_id,
      courseTitle: s.course_title,
      facilitatorId: s.facilitator_id,
      facilitatorName: s.facilitator_first_name ? `${s.facilitator_first_name} ${s.facilitator_last_name}` : null,
      title: s.title,
      description: s.description,
      scheduledAt: s.scheduled_at,
      durationMinutes: s.duration_minutes,
      location: s.location,
      maxParticipants: s.max_participants,
      status: s.status,
      createdAt: s.created_at,
      participants: participantsResult.rows.map(p => ({
        id: p.id,
        userId: p.user_id,
        userName: `${p.first_name} ${p.last_name}`,
        userEmail: p.email,
        status: p.status,
        markedAt: p.marked_at
      }))
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
};

// Create session
const createSession = async (req, res) => {
  try {
    const { courseId, title, description, scheduledAt, durationMinutes, location, maxParticipants } = req.body;

    // Verify course exists
    const courseCheck = await pool.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const result = await pool.query(
      `INSERT INTO sessions (course_id, facilitator_id, title, description, scheduled_at, duration_minutes, location, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [courseId, req.user.id, title, description, scheduledAt, durationMinutes || 60, location, maxParticipants || 30]
    );

    const s = result.rows[0];

    res.status(201).json({
      message: 'Session created',
      session: {
        id: s.id,
        courseId: s.course_id,
        title: s.title,
        scheduledAt: s.scheduled_at,
        status: s.status
      }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

// Update session
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, scheduledAt, durationMinutes, location, maxParticipants, status } = req.body;

    const result = await pool.query(
      `UPDATE sessions 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           scheduled_at = COALESCE($3, scheduled_at),
           duration_minutes = COALESCE($4, duration_minutes),
           location = COALESCE($5, location),
           max_participants = COALESCE($6, max_participants),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, scheduledAt, durationMinutes, location, maxParticipants, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const s = result.rows[0];

    res.json({
      message: 'Session updated',
      session: {
        id: s.id,
        title: s.title,
        status: s.status,
        scheduledAt: s.scheduled_at
      }
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
};

// Delete session
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sessions WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

// Start session
const startSession = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE sessions SET status = 'in_progress', updated_at = NOW()
       WHERE id = $1 AND status = 'scheduled'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or already started' });
    }

    res.json({ message: 'Session started', sessionId: id });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
};

// End session
const endSession = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE sessions SET status = 'completed', updated_at = NOW()
       WHERE id = $1 AND status = 'in_progress'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or not in progress' });
    }

    res.json({ message: 'Session ended', sessionId: id });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
};

// Get available sessions for learners (scheduled, not full)
const getAvailableSessions = async (req, res) => {
  try {
    const { courseId } = req.query;

    let query = `
      SELECT s.*, 
             c.title as course_title,
             u.first_name as facilitator_first_name,
             u.last_name as facilitator_last_name,
             COUNT(DISTINCT sb.id) as booked_count,
             EXISTS(SELECT 1 FROM session_bookings WHERE session_id = s.id AND user_id = $1) as is_booked
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN users u ON s.facilitator_id = u.id
       LEFT JOIN session_bookings sb ON sb.session_id = s.id AND sb.status = 'booked'
       WHERE s.status = 'scheduled' AND s.scheduled_at > NOW()
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (courseId) {
      query += ` AND s.course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    query += ` GROUP BY s.id, c.title, u.first_name, u.last_name ORDER BY s.scheduled_at ASC`;

    const result = await pool.query(query, params);

    const sessions = result.rows.map(s => ({
      id: s.id,
      courseId: s.course_id,
      courseTitle: s.course_title,
      facilitatorName: s.facilitator_first_name ? `${s.facilitator_first_name} ${s.facilitator_last_name}` : null,
      title: s.title,
      description: s.description,
      scheduledAt: s.scheduled_at,
      durationMinutes: s.duration_minutes,
      location: s.location,
      maxParticipants: s.max_participants,
      bookedCount: parseInt(s.booked_count),
      availableSpots: s.max_participants - parseInt(s.booked_count),
      isBooked: s.is_booked,
      status: s.status
    }));

    res.json({ sessions });
  } catch (error) {
    console.error('Get available sessions error:', error);
    res.status(500).json({ error: 'Failed to get available sessions' });
  }
};

// Book a session (learner)
const bookSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if session exists and is available
    const sessionResult = await pool.query(
      `SELECT s.*, COUNT(sb.id) as booked_count
       FROM sessions s
       LEFT JOIN session_bookings sb ON sb.session_id = s.id AND sb.status = 'booked'
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.status !== 'scheduled') {
      return res.status(400).json({ error: 'Session is not available for booking' });
    }

    if (new Date(session.scheduled_at) < new Date()) {
      return res.status(400).json({ error: 'Session has already started' });
    }

    if (parseInt(session.booked_count) >= session.max_participants) {
      return res.status(400).json({ error: 'Session is full' });
    }

    // Check if already booked
    const existingBooking = await pool.query(
      `SELECT id FROM session_bookings WHERE session_id = $1 AND user_id = $2 AND status = 'booked'`,
      [id, userId]
    );

    if (existingBooking.rows.length > 0) {
      return res.status(400).json({ error: 'You have already booked this session' });
    }

    // Create booking
    const result = await pool.query(
      `INSERT INTO session_bookings (session_id, user_id, status)
       VALUES ($1, $2, 'booked')
       ON CONFLICT (session_id, user_id) 
       DO UPDATE SET status = 'booked', cancelled_at = NULL, booked_at = NOW()
       RETURNING *`,
      [id, userId]
    );

    // Also add to attendance table with pending status
    await pool.query(
      `INSERT INTO attendance (session_id, user_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (session_id, user_id) DO NOTHING`,
      [id, userId]
    );

    res.status(201).json({
      message: 'Session booked successfully',
      booking: {
        id: result.rows[0].id,
        sessionId: id,
        bookedAt: result.rows[0].booked_at
      }
    });
  } catch (error) {
    console.error('Book session error:', error);
    res.status(500).json({ error: 'Failed to book session' });
  }
};

// Cancel booking (learner)
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if session hasn't started
    const sessionResult = await pool.query(
      `SELECT s.scheduled_at FROM sessions s
       JOIN session_bookings sb ON sb.session_id = s.id
       WHERE sb.session_id = $1 AND sb.user_id = $2 AND sb.status = 'booked'`,
      [id, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (new Date(sessionResult.rows[0].scheduled_at) < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel booking for a session that has started' });
    }

    // Cancel the booking
    await pool.query(
      `UPDATE session_bookings SET status = 'cancelled', cancelled_at = NOW()
       WHERE session_id = $1 AND user_id = $2`,
      [id, userId]
    );

    // Remove from attendance
    await pool.query(
      `DELETE FROM attendance WHERE session_id = $1 AND user_id = $2 AND status = 'pending'`,
      [id, userId]
    );

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// Get my bookings (learner)
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT sb.*, 
              s.title as session_title, s.description as session_description,
              s.scheduled_at, s.duration_minutes, s.location, s.status as session_status,
              c.title as course_title,
              u.first_name as facilitator_first_name, u.last_name as facilitator_last_name
       FROM session_bookings sb
       JOIN sessions s ON sb.session_id = s.id
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN users u ON s.facilitator_id = u.id
       WHERE sb.user_id = $1 AND sb.status = 'booked'
       ORDER BY s.scheduled_at ASC`,
      [userId]
    );

    const bookings = result.rows.map(b => ({
      id: b.id,
      sessionId: b.session_id,
      sessionTitle: b.session_title,
      sessionDescription: b.session_description,
      courseTitle: b.course_title,
      facilitatorName: b.facilitator_first_name ? `${b.facilitator_first_name} ${b.facilitator_last_name}` : null,
      scheduledAt: b.scheduled_at,
      durationMinutes: b.duration_minutes,
      location: b.location,
      sessionStatus: b.session_status,
      bookedAt: b.booked_at
    }));

    res.json({ bookings });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
};

module.exports = {
  getAllSessions,
  getMySessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  startSession,
  endSession,
  getAvailableSessions,
  bookSession,
  cancelBooking,
  getMyBookings
};
