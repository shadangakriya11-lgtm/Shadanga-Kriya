const pool = require('../config/db.js');

// Get user's progress for a course
const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get all lessons for the course with user's progress
    const result = await pool.query(
      `SELECT l.id, l.title, l.order_index, l.duration_minutes,
              lp.completed, lp.time_spent_seconds, lp.last_position_seconds, lp.completed_at, lp.pauses_used
       FROM lessons l
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
       WHERE l.course_id = $2
       ORDER BY l.order_index`,
      [req.user.id, courseId]
    );

    const lessons = result.rows.map(l => ({
      id: l.id,
      title: l.title,
      orderIndex: l.order_index,
      durationMinutes: l.duration_minutes,
      completed: l.completed || false,
      timeSpentSeconds: l.time_spent_seconds || 0,
      lastPositionSeconds: l.last_position_seconds || 0,
      completedAt: l.completed_at,
      pausesUsed: l.pauses_used || 0
    }));

    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.completed).length;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    res.json({
      courseId,
      progressPercent,
      totalLessons,
      completedLessons,
      lessons
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
};

// Update lesson progress
const updateLessonProgress = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { completed, timeSpentSeconds, lastPositionSeconds } = req.body;

    // Get lesson and course info
    const lessonInfo = await pool.query(
      'SELECT course_id FROM lessons WHERE id = $1',
      [lessonId]
    );

    if (lessonInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const courseId = lessonInfo.rows[0].course_id;

    // Check if enrolled
    const enrollmentCheck = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // Upsert progress
    const result = await pool.query(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed, time_spent_seconds, last_position_seconds, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, lesson_id) 
       DO UPDATE SET 
         completed = COALESCE($3, lesson_progress.completed),
         time_spent_seconds = COALESCE($4, lesson_progress.time_spent_seconds),
         last_position_seconds = COALESCE($5, lesson_progress.last_position_seconds),
         completed_at = CASE WHEN $3 = true AND lesson_progress.completed_at IS NULL THEN NOW() ELSE lesson_progress.completed_at END,
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, lessonId, completed, timeSpentSeconds, lastPositionSeconds, completed ? new Date() : null]
    );

    // Update enrollment progress percent
    const progressStats = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE lp.completed = true) as completed
       FROM lessons l
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
       WHERE l.course_id = $2`,
      [req.user.id, courseId]
    );

    const { total, completed: completedCount } = progressStats.rows[0];
    const progressPercent = parseInt(total) > 0 ? Math.round((parseInt(completedCount) / parseInt(total)) * 100) : 0;

    await pool.query(
      `UPDATE enrollments 
       SET progress_percent = $1, 
           completed_at = CASE WHEN $1 = 100 THEN NOW() ELSE completed_at END
       WHERE user_id = $2 AND course_id = $3`,
      [progressPercent, req.user.id, courseId]
    );

    const p = result.rows[0];

    res.json({
      message: 'Progress updated',
      progress: {
        lessonId: p.lesson_id,
        completed: p.completed,
        timeSpentSeconds: p.time_spent_seconds,
        lastPositionSeconds: p.last_position_seconds,
        completedAt: p.completed_at
      },
      courseProgressPercent: progressPercent
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

// Get overall user progress (learner dashboard)
const getOverallProgress = async (req, res) => {
  try {
    const statsResult = await pool.query(
      `SELECT 
         COUNT(DISTINCT e.course_id) as enrolled_courses,
         COUNT(DISTINCT e.course_id) FILTER (WHERE e.completed_at IS NOT NULL) as completed_courses,
         COALESCE(SUM(lp.time_spent_seconds), 0) as total_time_spent
       FROM enrollments e
       LEFT JOIN lesson_progress lp ON lp.user_id = e.user_id
       WHERE e.user_id = $1`,
      [req.user.id]
    );

    const lessonsResult = await pool.query(
      `SELECT 
         COUNT(l.id) as total_lessons,
         COUNT(lp.id) FILTER (WHERE lp.completed = true) as completed_lessons,
         COUNT(lp.id) FILTER (WHERE lp.completed = false AND lp.time_spent_seconds > 0) as in_progress_lessons
       FROM enrollments e
       JOIN lessons l ON l.course_id = e.course_id
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = e.user_id
       WHERE e.user_id = $1`,
      [req.user.id]
    );

    const stats = statsResult.rows[0];
    const lessons = lessonsResult.rows[0];

    res.json({
      enrolledCourses: parseInt(stats.enrolled_courses),
      completedCourses: parseInt(stats.completed_courses),
      totalTimeSpentSeconds: parseInt(stats.total_time_spent),
      totalLessons: parseInt(lessons.total_lessons),
      completedLessons: parseInt(lessons.completed_lessons),
      inProgressLessons: parseInt(lessons.in_progress_lessons)
    });
  } catch (error) {
    console.error('Get overall progress error:', error);
    res.status(500).json({ error: 'Failed to get overall progress' });
  }
};

// Get all users' progress (admin)
const getAllProgress = async (req, res) => {
  try {
    const { courseId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id as user_id, u.first_name, u.last_name, u.email,
             COUNT(DISTINCT e.course_id) as enrolled_courses,
             ROUND(AVG(e.progress_percent), 1) as avg_progress,
             COALESCE(SUM(lp.time_spent_seconds), 0) as total_time_spent
       FROM users u
       LEFT JOIN enrollments e ON e.user_id = u.id
       LEFT JOIN lesson_progress lp ON lp.user_id = u.id
       WHERE u.role = 'learner'
    `;
    const params = [];
    let paramIndex = 1;

    if (courseId) {
      query += ` AND e.course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    query += ` GROUP BY u.id, u.first_name, u.last_name, u.email`;

    // Get count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM (${query}) as subquery`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY avg_progress DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const progress = result.rows.map(r => ({
      userId: r.user_id,
      userName: `${r.first_name} ${r.last_name}`,
      userEmail: r.email,
      enrolledCourses: parseInt(r.enrolled_courses),
      avgProgress: parseFloat(r.avg_progress) || 0,
      totalTimeSpentSeconds: parseInt(r.total_time_spent)
    }));

    res.json({
      progress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
};

// Grant extra pause attempts to a user for a lesson (admin)
const grantExtraPause = async (req, res) => {
  try {
    const { userId, lessonId } = req.params;
    const { additionalPauses = 1 } = req.body;

    // Get current lesson max pauses
    const lessonResult = await pool.query(
      'SELECT max_pauses FROM lessons WHERE id = $1',
      [lessonId]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Update or insert lesson progress with reduced pauses_used count
    const result = await pool.query(
      `INSERT INTO lesson_progress (user_id, lesson_id, pauses_used, completed)
       VALUES ($1, $2, 0, false)
       ON CONFLICT (user_id, lesson_id) 
       DO UPDATE SET 
         pauses_used = GREATEST(0, lesson_progress.pauses_used - $3),
         updated_at = NOW()
       RETURNING *`,
      [userId, lessonId, additionalPauses]
    );

    // Log the action
    console.log(`Admin ${req.user.id} granted ${additionalPauses} extra pause(s) to user ${userId} for lesson ${lessonId}`);

    res.json({
      message: `Granted ${additionalPauses} extra pause(s)`,
      progress: {
        pausesUsed: result.rows[0].pauses_used,
        lessonId: result.rows[0].lesson_id,
        userId: result.rows[0].user_id
      }
    });
  } catch (error) {
    console.error('Grant extra pause error:', error);
    res.status(500).json({ error: 'Failed to grant extra pause' });
  }
};

// Reset lesson progress for a user (admin)
const resetLessonProgress = async (req, res) => {
  try {
    const { userId, lessonId } = req.params;

    // Get lesson info to find course
    const lessonResult = await pool.query(
      'SELECT course_id FROM lessons WHERE id = $1',
      [lessonId]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const courseId = lessonResult.rows[0].course_id;

    // Delete the lesson progress
    await pool.query(
      'DELETE FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );

    // Recalculate enrollment progress
    const progressStats = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE lp.completed = true) as completed
       FROM lessons l
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
       WHERE l.course_id = $2`,
      [userId, courseId]
    );

    const { total, completed } = progressStats.rows[0];
    const progressPercent = parseInt(total) > 0 ? Math.round((parseInt(completed) / parseInt(total)) * 100) : 0;

    await pool.query(
      `UPDATE enrollments 
       SET progress_percent = $1,
           completed_at = CASE WHEN $1 < 100 THEN NULL ELSE completed_at END
       WHERE user_id = $2 AND course_id = $3`,
      [progressPercent, userId, courseId]
    );

    // Log the action
    console.log(`Admin ${req.user.id} reset lesson ${lessonId} progress for user ${userId}`);

    res.json({
      message: 'Lesson progress reset successfully',
      courseProgressPercent: progressPercent
    });
  } catch (error) {
    console.error('Reset lesson progress error:', error);
    res.status(500).json({ error: 'Failed to reset lesson progress' });
  }
};

// Lock a lesson for a user (admin) - sets to interrupted status
const lockLesson = async (req, res) => {
  try {
    const { userId, lessonId } = req.params;

    // Update lesson progress to locked/interrupted status
    const result = await pool.query(
      `INSERT INTO lesson_progress (user_id, lesson_id, status, locked)
       VALUES ($1, $2, 'interrupted', true)
       ON CONFLICT (user_id, lesson_id) 
       DO UPDATE SET 
         status = 'interrupted',
         locked = true,
         updated_at = NOW()
       RETURNING *`,
      [userId, lessonId]
    );

    // Log the action
    console.log(`Admin ${req.user.id} locked lesson ${lessonId} for user ${userId}`);

    res.json({
      message: 'Lesson locked successfully',
      progress: {
        lessonId: result.rows[0].lesson_id,
        userId: result.rows[0].user_id,
        locked: result.rows[0].locked
      }
    });
  } catch (error) {
    console.error('Lock lesson error:', error);
    res.status(500).json({ error: 'Failed to lock lesson' });
  }
};

module.exports = {
  getCourseProgress,
  updateLessonProgress,
  getOverallProgress,
  getAllProgress,
  grantExtraPause,
  resetLessonProgress,
  lockLesson
};
