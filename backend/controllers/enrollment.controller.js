const pool = require('../config/db.js');

// Get user's enrollments
const getMyEnrollments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, 
              c.title as course_title, 
              c.thumbnail_url, 
              c.duration_hours,
              c.category,
              COUNT(l.id) as total_lessons,
              COUNT(lp.id) FILTER (WHERE lp.completed = true) as completed_lessons
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN lessons l ON l.course_id = c.id
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = e.user_id
       WHERE e.user_id = $1
       GROUP BY e.id, c.title, c.thumbnail_url, c.duration_hours, c.category
       ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );

    const enrollments = result.rows.map(e => ({
      id: e.id,
      courseId: e.course_id,
      courseTitle: e.course_title,
      thumbnailUrl: e.thumbnail_url,
      durationHours: e.duration_hours,
      category: e.category,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
      progressPercent: e.progress_percent,
      totalLessons: parseInt(e.total_lessons),
      completedLessons: parseInt(e.completed_lessons)
    }));

    res.json({ enrollments });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to get enrollments' });
  }
};

// Enroll in course
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if course exists and is published
    const courseCheck = await pool.query(
      'SELECT id, title, price FROM courses WHERE id = $1 AND status = $2',
      [courseId, 'published']
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found or not available' });
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    const result = await pool.query(
      `INSERT INTO enrollments (user_id, course_id)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, courseId]
    );

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment: {
        id: result.rows[0].id,
        courseId: result.rows[0].course_id,
        courseTitle: courseCheck.rows[0].title,
        enrolledAt: result.rows[0].enrolled_at
      }
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll' });
  }
};

// Get all enrollments (admin)
const getAllEnrollments = async (req, res) => {
  try {
    const { courseId, userId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT e.*, 
             c.title as course_title,
             u.first_name, u.last_name, u.email
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.user_id = u.id
       WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (courseId) {
      query += ` AND e.course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    if (userId) {
      query += ` AND e.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    // Get count
    const countResult = await pool.query(
      query.replace(/SELECT e\.\*.*FROM/, 'SELECT COUNT(*) FROM'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY e.enrolled_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const enrollments = result.rows.map(e => ({
      id: e.id,
      courseId: e.course_id,
      courseTitle: e.course_title,
      userId: e.user_id,
      userName: `${e.first_name} ${e.last_name}`,
      userEmail: e.email,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
      progressPercent: e.progress_percent
    }));

    res.json({
      enrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all enrollments error:', error);
    res.status(500).json({ error: 'Failed to get enrollments' });
  }
};

// Unenroll from course
const unenrollFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query(
      'DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2 RETURNING id',
      [req.user.id, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json({ message: 'Unenrolled successfully' });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ error: 'Failed to unenroll' });
  }
};

// Get enrollment stats
const getEnrollmentStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed,
        COUNT(*) FILTER (WHERE progress_percent > 0 AND completed_at IS NULL) as in_progress,
        COUNT(*) FILTER (WHERE enrolled_at > NOW() - INTERVAL '7 days') as new_this_week,
        ROUND(AVG(progress_percent), 1) as avg_progress
      FROM enrollments
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get enrollment stats error:', error);
    res.status(500).json({ error: 'Failed to get enrollment stats' });
  }
};

// Get enrollments for a specific course (admin)
const getEnrollmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query(
      `SELECT e.*, 
              u.first_name, u.last_name, u.email
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       WHERE e.course_id = $1
       ORDER BY e.enrolled_at DESC`,
      [courseId]
    );

    const enrollments = result.rows.map(e => ({
      id: e.id,
      userId: e.user_id,
      courseId: e.course_id,
      userName: `${e.first_name} ${e.last_name}`,
      userEmail: e.email,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
      progressPercent: e.progress_percent
    }));

    res.json({ enrollments });
  } catch (error) {
    console.error('Get enrollments by course error:', error);
    res.status(500).json({ error: 'Failed to get enrollments' });
  }
};

// Admin enroll a user in a course
const adminEnrollUser = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    // Check if course exists
    const courseCheck = await pool.query(
      'SELECT id, title FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if user exists and is a learner
    const userCheck = await pool.query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({ error: 'User already enrolled in this course' });
    }

    // Create enrollment
    const result = await pool.query(
      `INSERT INTO enrollments (user_id, course_id, status)
       VALUES ($1, $2, 'active')
       RETURNING *`,
      [userId, courseId]
    );

    res.status(201).json({
      message: 'User enrolled successfully',
      enrollment: {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        courseId: result.rows[0].course_id,
        userName: `${userCheck.rows[0].first_name} ${userCheck.rows[0].last_name}`,
        courseTitle: courseCheck.rows[0].title,
        enrolledAt: result.rows[0].enrolled_at
      }
    });
  } catch (error) {
    console.error('Admin enroll user error:', error);
    res.status(500).json({ error: 'Failed to enroll user' });
  }
};

// Admin unenroll a user from a course
const adminUnenrollUser = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const result = await pool.query(
      'DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2 RETURNING id',
      [userId, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json({ message: 'User unenrolled successfully' });
  } catch (error) {
    console.error('Admin unenroll user error:', error);
    res.status(500).json({ error: 'Failed to unenroll user' });
  }
};

module.exports = {
  getMyEnrollments,
  enrollInCourse,
  getAllEnrollments,
  unenrollFromCourse,
  getEnrollmentStats,
  getEnrollmentsByCourse,
  adminEnrollUser,
  adminUnenrollUser
};
