const pool = require('../config/db.js');

// Get dashboard stats (admin)
const getDashboardStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM courses WHERE status != 'archived') as total_courses,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM sessions WHERE status = 'scheduled' AND scheduled_at < NOW() + INTERVAL '24 hours') as alerts,
        (SELECT COALESCE(ROUND(AVG(progress_percent), 1), 0) FROM enrollments) as avg_completion_rate
    `);

    const row = stats.rows[0];

    // Map to camelCase keys expected by frontend
    res.json({
      totalUsers: parseInt(row.total_users),
      activeUsers: parseInt(row.active_users),
      totalCourses: parseInt(row.total_courses),
      revenue: parseFloat(row.total_revenue),
      completionRate: parseFloat(row.avg_completion_rate),
      alerts: parseInt(row.alerts)
    });
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
      weekly: result.rows,
      coursePerformance: topCourses.rows
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

// Get monitoring stats
const getMonitoringStats = async (req, res) => {
  try {
    // Stats Summary
    const statsQuery = await pool.query(`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM lesson_progress WHERE updated_at > NOW() - INTERVAL '1 hour') as active_sessions,
        (SELECT COUNT(*) FROM lesson_progress WHERE completed = true AND completed_at::date = CURRENT_DATE) as completed_today,
        (SELECT COUNT(*) FROM lesson_progress WHERE pauses_used >= 3) as interrupted,
        (SELECT COUNT(*) FROM lesson_progress WHERE pauses_used > 0) as pause_requests
    `);

    // Recent Progress (Real-time monitoring table)
    const progressQuery = await pool.query(`
      SELECT 
        lp.id,
        u.id as user_id,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        l.id as lesson_id,
        l.title as lesson_title,
        c.title as course_title,
        lp.time_spent_seconds as progress_seconds,
        l.duration_seconds as total_seconds,
        lp.pauses_used,
        l.max_pauses,
        lp.status,
        lp.updated_at as last_activity
      FROM lesson_progress lp
      JOIN users u ON lp.user_id = u.id
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN courses c ON l.course_id = c.id
      ORDER BY lp.updated_at DESC
      LIMIT 50
    `);

    const stats = statsQuery.rows[0];
    const progress = progressQuery.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      lessonId: row.lesson_id,
      lessonTitle: row.lesson_title,
      courseTitle: row.course_title,
      progress: Math.min(100, Math.round((row.progress_seconds / (row.total_seconds || 1)) * 100)), // Approximate percentage
      pausesUsed: row.pauses_used,
      maxPauses: row.max_pauses,
      status: row.status === 'locked' ? 'interrupted' : (row.status === 'completed' ? 'completed' : 'in_progress'), // Map DB status to frontend status
      lastActivity: row.last_activity
    }));

    res.json({
      stats: {
        activeSessions: parseInt(stats.active_sessions) || 0,
        completedToday: parseInt(stats.completed_today) || 0,
        interrupted: parseInt(stats.interrupted) || 0,
        pauseRequests: parseInt(stats.pause_requests) || 0
      },
      monitoring: progress
    });
  } catch (error) {
    console.error('Get monitoring stats error:', error);
    res.status(500).json({ error: 'Failed to get monitoring stats' });
  }
};

module.exports = {
  getDashboardStats,
  getEnrollmentTrends,
  getRevenueAnalytics,
  getCourseAnalytics,
  getFacilitatorStats,
  getLearnerStats,
  getMonitoringStats
};
