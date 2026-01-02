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
      durationMinutes: l.duration_minutes,
      orderIndex: l.order_index,
      maxPauses: l.max_pauses,
      isLocked: l.is_locked,
      createdAt: l.created_at
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

    const result = await pool.query(
      `INSERT INTO lessons (course_id, title, description, content, audio_url, video_url, duration_minutes, order_index, is_locked, max_pauses)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [courseId, title, description, content, audioUrl, videoUrl, durationMinutes || 0, finalOrderIndex, isLocked || false, maxPauses || 3]
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

    const result = await pool.query(
      `UPDATE lessons 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           content = COALESCE($3, content),
           audio_url = COALESCE($4, audio_url),
           video_url = COALESCE($5, video_url),
           duration_minutes = COALESCE($6, duration_minutes),
           order_index = COALESCE($7, order_index),
           is_locked = COALESCE($8, is_locked),
           max_pauses = COALESCE($9, max_pauses),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [title, description, content, audioUrl, videoUrl, durationMinutes, orderIndex, isLocked, maxPauses, id]
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

module.exports = {
  getLessonsByCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons
};
