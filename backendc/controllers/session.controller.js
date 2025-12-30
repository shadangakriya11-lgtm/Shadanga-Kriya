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

module.exports = {
  getAllSessions,
  getMySessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  startSession,
  endSession
};
