const pool = require('../config/db.js');

// Get dashboard stats (admin)
const getDashboardStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'learner') as total_learners,
        (SELECT COUNT(*) FROM users WHERE role = 'facilitator') as total_facilitators,
        (SELECT COUNT(*) FROM courses WHERE status = 'published') as active_courses,
        (SELECT COUNT(*) FROM enrollments) as total_enrollments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM sessions WHERE status = 'scheduled') as upcoming_sessions,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_this_week,
        (SELECT ROUND(AVG(progress_percent), 1) FROM enrollments) as avg_completion_rate
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

// Get enrollment trends
const getEnrollmentTrends = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    const result = await pool.query(`
      SELECT 
        DATE(enrolled_at) as date,
        COUNT(*) as enrollments
      FROM enrollments
      WHERE enrolled_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(enrolled_at)
      ORDER BY date
    `);

    res.json({ trends: result.rows });
  } catch (error) {
    console.error('Get enrollment trends error:', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
};

// Get revenue analytics
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM payments
      WHERE status = 'completed' AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Get top courses by revenue
    const topCourses = await pool.query(`
      SELECT c.title, SUM(p.amount) as revenue, COUNT(p.id) as sales
      FROM payments p
      JOIN courses c ON p.course_id = c.id
      WHERE p.status = 'completed'
      GROUP BY c.id, c.title
      ORDER BY revenue DESC
      LIMIT 5
    `);

    res.json({
      daily: result.rows,
      topCourses: topCourses.rows
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to get revenue analytics' });
  }
};

// Get course analytics
const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;

    const stats = await pool.query(`
      SELECT 
        c.title,
        c.status,
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT e.id) FILTER (WHERE e.completed_at IS NOT NULL) as completions,
        ROUND(AVG(e.progress_percent), 1) as avg_progress,
        COUNT(DISTINCT l.id) as total_lessons,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) as total_revenue
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN payments p ON p.course_id = c.id
      WHERE c.id = $1
      GROUP BY c.id, c.title, c.status
    `, [courseId]);

    if (stats.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get lesson completion rates
    const lessonStats = await pool.query(`
      SELECT 
        l.title,
        l.order_index,
        COUNT(DISTINCT lp.id) FILTER (WHERE lp.completed = true) as completions,
        COUNT(DISTINCT e.user_id) as total_enrolled
      FROM lessons l
      JOIN enrollments e ON e.course_id = l.course_id
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = e.user_id
      WHERE l.course_id = $1
      GROUP BY l.id, l.title, l.order_index
      ORDER BY l.order_index
    `, [courseId]);

    res.json({
      ...stats.rows[0],
      lessons: lessonStats.rows
    });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({ error: 'Failed to get course analytics' });
  }
};

// Get facilitator stats
const getFacilitatorStats = async (req, res) => {
  try {
    const facilitatorId = req.user.role === 'admin' ? req.query.facilitatorId : req.user.id;

    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as completed_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'scheduled') as upcoming_sessions,
        COUNT(DISTINCT a.user_id) as total_participants,
        ROUND(
          COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'present')::numeric / 
          NULLIF(COUNT(DISTINCT a.id), 0) * 100, 1
        ) as avg_attendance_rate
      FROM sessions s
      LEFT JOIN attendance a ON a.session_id = s.id
      WHERE s.facilitator_id = $1
    `, [facilitatorId]);

    // Get recent sessions
    const recentSessions = await pool.query(`
      SELECT s.id, s.title, s.scheduled_at, s.status, c.title as course_title,
             COUNT(a.id) as participant_count
      FROM sessions s
      JOIN courses c ON s.course_id = c.id
      LEFT JOIN attendance a ON a.session_id = s.id
      WHERE s.facilitator_id = $1
      GROUP BY s.id, s.title, s.scheduled_at, s.status, c.title
      ORDER BY s.scheduled_at DESC
      LIMIT 10
    `, [facilitatorId]);

    res.json({
      ...stats.rows[0],
      recentSessions: recentSessions.rows
    });
  } catch (error) {
    console.error('Get facilitator stats error:', error);
    res.status(500).json({ error: 'Failed to get facilitator stats' });
  }
};

// Get learner stats
const getLearnerStats = async (req, res) => {
  try {
    const learnerId = req.user.role === 'admin' ? req.params.learnerId : req.user.id;

    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT e.course_id) as enrolled_courses,
        COUNT(DISTINCT e.course_id) FILTER (WHERE e.completed_at IS NOT NULL) as completed_courses,
        ROUND(AVG(e.progress_percent), 1) as avg_progress,
        COALESCE(SUM(lp.time_spent_seconds), 0) as total_learning_time,
        COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed = true) as completed_lessons
      FROM enrollments e
      LEFT JOIN lesson_progress lp ON lp.user_id = e.user_id
      WHERE e.user_id = $1
    `, [learnerId]);

    // Get course progress
    const courseProgress = await pool.query(`
      SELECT 
        c.id, c.title, c.thumbnail_url,
        e.progress_percent,
        e.enrolled_at,
        e.completed_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = $1
      ORDER BY e.enrolled_at DESC
    `, [learnerId]);

    res.json({
      ...stats.rows[0],
      courses: courseProgress.rows
    });
  } catch (error) {
    console.error('Get learner stats error:', error);
    res.status(500).json({ error: 'Failed to get learner stats' });
  }
};

module.exports = {
  getDashboardStats,
  getEnrollmentTrends,
  getRevenueAnalytics,
  getCourseAnalytics,
  getFacilitatorStats,
  getLearnerStats
};
