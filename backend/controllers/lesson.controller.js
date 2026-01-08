const pool = require('../config/db.js');

// Get lessons by course
const getLessonsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query(
      `SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index`,
      [courseId]
    );

    const lessons = result.rows.map(l => ({
      id: l.id,
      courseId: l.course_id,
      title: l.title,
      description: l.description,
      content: l.content,
      audioUrl: l.audio_url,
      videoUrl: l.video_url,
      duration: l.duration,
      durationSeconds: l.duration_seconds,
      durationMinutes: l.duration_minutes,
      orderIndex: l.order_index,
      maxPauses: l.max_pauses,
      isLocked: l.is_locked,
      createdAt: l.created_at,
      // Access Code fields
      accessCodeEnabled: l.access_code_enabled,
      hasAccessCode: !!l.access_code,
      accessCodeType: l.access_code_type,
      accessCodeExpired: l.access_code_type === 'temporary' && l.access_code_expires_at && new Date(l.access_code_expires_at) < new Date()
    }));

    res.json({ lessons });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Failed to get lessons' });
  }
};

// Get lesson by ID
const getLessonById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT l.*, c.title as course_title
       FROM lessons l
       JOIN courses c ON l.course_id = c.id
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const l = result.rows[0];

    // Get user's progress if authenticated
    let progress = null;
    if (req.user) {
      const progressResult = await pool.query(
        `SELECT completed, time_spent_seconds, last_position_seconds
         FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2`,
        [req.user.id, id]
      );
      if (progressResult.rows.length > 0) {
        progress = progressResult.rows[0];
      }
    }

    res.json({
      id: l.id,
      courseId: l.course_id,
      courseTitle: l.course_title,
      title: l.title,
      description: l.description,
      content: l.content,
      audioUrl: l.audio_url,
      videoUrl: l.video_url,
      duration: l.duration,
      durationSeconds: l.duration_seconds,
      durationMinutes: l.duration_minutes,
      orderIndex: l.order_index,
      maxPauses: l.max_pauses,
      isLocked: l.is_locked,
      createdAt: l.created_at,
      progress: progress ? {
        completed: progress.completed,
        timeSpentSeconds: progress.time_spent_seconds,
        lastPositionSeconds: progress.last_position_seconds
      } : null
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Failed to get lesson' });
  }
};

// Create lesson
const createLesson = async (req, res) => {
  try {
    const { courseId, title, description, content, videoUrl, durationMinutes, orderIndex, isLocked, maxPauses } = req.body;

    // Get audio URL from uploaded file or request body (fallback)
    const audioUrl = req.file ? req.file.path : req.body.audioUrl;

    // Verify course exists
    const courseCheck = await pool.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get next order index if not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined) {
      const maxOrder = await pool.query(
        'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM lessons WHERE course_id = $1',
        [courseId]
      );
      finalOrderIndex = maxOrder.rows[0].next_order;
    }

    // Calculate duration fields
    const durationMins = durationMinutes || 0;
    const durationSecs = durationMins * 60;
    const durationStr = durationMins > 0 ? `${durationMins} min` : '0 min';

    const result = await pool.query(
      `INSERT INTO lessons (course_id, title, description, content, audio_url, video_url, duration, duration_seconds, duration_minutes, order_index, is_locked, max_pauses)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [courseId, title, description, content, audioUrl, videoUrl, durationStr, durationSecs, durationMins, finalOrderIndex, isLocked || false, maxPauses || 3]
    );

    const l = result.rows[0];

    res.status(201).json({
      message: 'Lesson created',
      lesson: {
        id: l.id,
        courseId: l.course_id,
        title: l.title,
        description: l.description,
        durationMinutes: l.duration_minutes,
        orderIndex: l.order_index,
        maxPauses: l.max_pauses,
        isLocked: l.is_locked,
        createdAt: l.created_at,
        audioUrl: l.audio_url
      }
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
};

// Update lesson
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, videoUrl, durationMinutes, orderIndex, isLocked, maxPauses } = req.body;

    // Get audio URL from uploaded file or request body
    const audioUrl = req.file ? req.file.path : req.body.audioUrl;

    // Calculate duration fields if durationMinutes is provided
    let durationStr = null;
    let durationSecs = null;
    if (durationMinutes !== undefined) {
      const durationMins = durationMinutes || 0;
      durationSecs = durationMins * 60;
      durationStr = durationMins > 0 ? `${durationMins} min` : '0 min';
    }

    const result = await pool.query(
      `UPDATE lessons 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           content = COALESCE($3, content),
           audio_url = COALESCE($4, audio_url),
           video_url = COALESCE($5, video_url),
           duration = COALESCE($6, duration),
           duration_seconds = COALESCE($7, duration_seconds),
           duration_minutes = COALESCE($8, duration_minutes),
           order_index = COALESCE($9, order_index),
           is_locked = COALESCE($10, is_locked),
           max_pauses = COALESCE($11, max_pauses),
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [title, description, content, audioUrl, videoUrl, durationStr, durationSecs, durationMinutes, orderIndex, isLocked, maxPauses, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const l = result.rows[0];

    res.json({
      message: 'Lesson updated',
      lesson: {
        id: l.id,
        courseId: l.course_id,
        title: l.title,
        description: l.description,
        durationMinutes: l.duration_minutes,
        orderIndex: l.order_index,
        isLocked: l.is_locked,
        updatedAt: l.updated_at
      }
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
};

// Delete lesson
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM lessons WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
};

// Reorder lessons
const reorderLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonIds } = req.body; // Array of lesson IDs in new order

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < lessonIds.length; i++) {
        await client.query(
          'UPDATE lessons SET order_index = $1 WHERE id = $2 AND course_id = $3',
          [i, lessonIds[i], courseId]
        );
      }

      await client.query('COMMIT');
      res.json({ message: 'Lessons reordered' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reorder lessons error:', error);
    res.status(500).json({ error: 'Failed to reorder lessons' });
  }
};

// ==================== ACCESS CODE FUNCTIONS ====================

// Generate random 6-digit access code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate or update lesson access code (admin)
const generateAccessCode = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { codeType, expiresInMinutes } = req.body;

    if (!['permanent', 'temporary'].includes(codeType)) {
      return res.status(400).json({ error: 'Invalid code type. Must be "permanent" or "temporary".' });
    }

    if (codeType === 'temporary' && (!expiresInMinutes || expiresInMinutes < 1)) {
      return res.status(400).json({ error: 'Expiration time required for temporary access code.' });
    }

    // Check if lesson exists
    const lessonCheck = await pool.query('SELECT id, title FROM lessons WHERE id = $1', [lessonId]);
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const code = generateCode();
    const now = new Date();
    const expiresAt = codeType === 'temporary'
      ? new Date(now.getTime() + expiresInMinutes * 60000)
      : null;

    const result = await pool.query(
      `UPDATE lessons 
       SET access_code = $1, access_code_type = $2, access_code_expires_at = $3, access_code_generated_at = $4, access_code_enabled = true
       WHERE id = $5
       RETURNING id, title, access_code, access_code_type, access_code_expires_at, access_code_generated_at, access_code_enabled`,
      [code, codeType, expiresAt, now, lessonId]
    );

    const lesson = result.rows[0];
    res.json({
      message: 'Access code generated successfully',
      accessCode: {
        code: lesson.access_code,
        type: lesson.access_code_type,
        expiresAt: lesson.access_code_expires_at,
        generatedAt: lesson.access_code_generated_at,
        isEnabled: lesson.access_code_enabled
      }
    });
  } catch (error) {
    console.error('Generate access code error:', error);
    res.status(500).json({ error: 'Failed to generate access code' });
  }
};

// Toggle access code requirement for a lesson (admin)
const toggleAccessCode = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    const result = await pool.query(
      `UPDATE lessons 
       SET access_code_enabled = $1
       WHERE id = $2
       RETURNING id, title, access_code_enabled, access_code, access_code_type, access_code_expires_at`,
      [enabled, lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const lesson = result.rows[0];
    res.json({
      message: `Access code requirement ${enabled ? 'enabled' : 'disabled'}`,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        accessCodeEnabled: lesson.access_code_enabled,
        hasAccessCode: !!lesson.access_code
      }
    });
  } catch (error) {
    console.error('Toggle access code error:', error);
    res.status(500).json({ error: 'Failed to toggle access code' });
  }
};

// Get lesson access code info (admin only)
const getAccessCodeInfo = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const result = await pool.query(
      `SELECT id, title, access_code_enabled, access_code, access_code_type, access_code_expires_at, access_code_generated_at
       FROM lessons WHERE id = $1`,
      [lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const lesson = result.rows[0];
    const isExpired = lesson.access_code_type === 'temporary' &&
      lesson.access_code_expires_at &&
      new Date(lesson.access_code_expires_at) < new Date();

    res.json({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      accessCodeEnabled: lesson.access_code_enabled,
      hasAccessCode: !!lesson.access_code,
      accessCode: lesson.access_code ? {
        code: lesson.access_code,
        type: lesson.access_code_type,
        expiresAt: lesson.access_code_expires_at,
        generatedAt: lesson.access_code_generated_at,
        isExpired
      } : null
    });
  } catch (error) {
    console.error('Get access code info error:', error);
    res.status(500).json({ error: 'Failed to get access code info' });
  }
};

// Verify access code for a lesson (learner)
const verifyAccessCode = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Access code is required' });
    }

    const result = await pool.query(
      `SELECT id, title, access_code_enabled, access_code, access_code_type, access_code_expires_at
       FROM lessons WHERE id = $1`,
      [lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const lesson = result.rows[0];

    // Check if access code is required
    if (!lesson.access_code_enabled) {
      return res.json({ valid: true, message: 'Lesson does not require access code' });
    }

    // Check if access code exists
    if (!lesson.access_code) {
      return res.status(400).json({ error: 'No access code set for this lesson. Contact admin.' });
    }

    // Check if access code is expired
    if (lesson.access_code_type === 'temporary' && lesson.access_code_expires_at) {
      if (new Date(lesson.access_code_expires_at) < new Date()) {
        return res.status(403).json({
          valid: false,
          error: 'Access code has expired. Please contact admin for a new code.'
        });
      }
    }

    // Verify access code
    if (lesson.access_code !== code.toString().trim()) {
      return res.status(403).json({ valid: false, error: 'Invalid access code' });
    }

    res.json({ valid: true, message: 'Access code verified successfully' });
  } catch (error) {
    console.error('Verify access code error:', error);
    res.status(500).json({ error: 'Failed to verify access code' });
  }
};

// Clear/remove access code from a lesson (admin)
const clearAccessCode = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const result = await pool.query(
      `UPDATE lessons 
       SET access_code = NULL, access_code_type = 'permanent', access_code_expires_at = NULL, access_code_generated_at = NULL
       WHERE id = $1
       RETURNING id, title`,
      [lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ message: 'Access code cleared successfully', lessonId: result.rows[0].id });
  } catch (error) {
    console.error('Clear access code error:', error);
    res.status(500).json({ error: 'Failed to clear access code' });
  }
};

module.exports = {
  getLessonsByCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  generateAccessCode,
  toggleAccessCode,
  getAccessCodeInfo,
  verifyAccessCode,
  clearAccessCode
};
