const pool = require('../config/db.js');

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
             u.first_name as creator_first_name, 
             u.last_name as creator_last_name,
             COUNT(DISTINCT l.id) as lesson_count,
             COUNT(DISTINCT e.id) as enrollment_count
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category) {
      query += ` AND c.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` GROUP BY c.id, u.first_name, u.last_name`;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) as subquery`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const courses = result.rows.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      price: parseFloat(course.price),
      durationHours: course.duration_hours,
      status: course.status,
      category: course.category,
      createdBy: course.created_by,
      creatorName: course.creator_first_name ? `${course.creator_first_name} ${course.creator_last_name}` : null,
      lessonCount: parseInt(course.lesson_count),
      enrollmentCount: parseInt(course.enrollment_count),
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }));

    res.json({
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to get courses' });
  }
};

// Get course by ID
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, 
              u.first_name as creator_first_name, 
              u.last_name as creator_last_name
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = result.rows[0];

    // Get lessons
    const lessonsResult = await pool.query(
      `SELECT id, title, description, duration_minutes, order_index, is_locked
       FROM lessons WHERE course_id = $1 ORDER BY order_index`,
      [id]
    );

    res.json({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      price: parseFloat(course.price),
      durationHours: course.duration_hours,
      status: course.status,
      category: course.category,
      createdBy: course.created_by,
      creatorName: course.creator_first_name ? `${course.creator_first_name} ${course.creator_last_name}` : null,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      lessons: lessonsResult.rows.map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        durationMinutes: l.duration_minutes,
        orderIndex: l.order_index,
        isLocked: l.is_locked
      }))
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to get course' });
  }
};

// Create course
const createCourse = async (req, res) => {
  try {
    const { title, description, thumbnailUrl, price, durationHours, status, category } = req.body;

    const result = await pool.query(
      `INSERT INTO courses (title, description, thumbnail_url, price, duration_hours, status, category, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description, thumbnailUrl, price || 0, durationHours || 0, status || 'draft', category, req.user.id]
    );

    const course = result.rows[0];

    res.status(201).json({
      message: 'Course created',
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnail_url,
        price: parseFloat(course.price),
        durationHours: course.duration_hours,
        status: course.status,
        category: course.category,
        createdAt: course.created_at
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, thumbnailUrl, price, durationHours, status, category } = req.body;

    const result = await pool.query(
      `UPDATE courses 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           thumbnail_url = COALESCE($3, thumbnail_url),
           price = COALESCE($4, price),
           duration_hours = COALESCE($5, duration_hours),
           status = COALESCE($6, status),
           category = COALESCE($7, category),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, thumbnailUrl, price, durationHours, status, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = result.rows[0];

    res.json({
      message: 'Course updated',
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnail_url,
        price: parseFloat(course.price),
        durationHours: course.duration_hours,
        status: course.status,
        category: course.category,
        updatedAt: course.updated_at
      }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM courses WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

// Get course stats
const getCourseStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'published') as published,
        COUNT(*) FILTER (WHERE status = 'draft') as draft,
        COUNT(*) FILTER (WHERE status = 'archived') as archived,
        COALESCE(SUM(duration_hours), 0) as total_hours
      FROM courses
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({ error: 'Failed to get course stats' });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStats
};
