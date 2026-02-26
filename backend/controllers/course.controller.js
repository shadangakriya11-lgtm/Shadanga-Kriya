const pool = require('../config/db.js');
const { notifyAdmins } = require('./notification.controller.js');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configure Cloudflare R2 (S3 Client) for deleting audio files
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  }
});

// Helper function to extract Key from R2 URL
// R2 URL format: https://{account_id}.r2.cloudflarestorage.com/{bucket}/{key}
const getR2KeyFromUrl = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    // Check if this is an R2 URL
    if (!urlObj.hostname.includes('r2.cloudflarestorage.com')) {
      return null;
    }
    // pathname is /{bucket}/{key}, we need to remove the bucket part
    const pathParts = urlObj.pathname.substring(1).split('/');
    if (pathParts.length > 1) {
      return pathParts.slice(1).join('/');
    }
    return null;
  } catch (e) {
    return null;
  }
};

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20, noPagination } = req.query;
    
    // If noPagination is true, fetch all courses without limit
    const shouldPaginate = noPagination !== 'true';
    const offset = shouldPaginate ? (page - 1) * limit : 0;

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

    // Role-based filtering
    if (req.user && req.user.role === 'facilitator') {
      query += ` AND (
        c.id IN (SELECT course_id FROM facilitator_courses WHERE user_id = $${paramIndex})
        OR c.created_by = $${paramIndex}
      )`;
      params.push(req.user.id);
      paramIndex++;
    }

    query += ` GROUP BY c.id, u.first_name, u.last_name`;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) as subquery`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results or all results
    query += ` ORDER BY c.created_at DESC`;
    if (shouldPaginate) {
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
    }

    const result = await pool.query(query, params);

    const courses = result.rows.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      price: parseFloat(course.price),
      durationHours: course.duration_hours,
      duration: course.duration,
      type: course.type,
      status: course.status,
      category: course.category,
      prerequisites: course.prerequisites,
      prerequisiteCourseId: course.prerequisite_course_id,
      createdBy: course.created_by,
      creatorName: course.creator_first_name ? `${course.creator_first_name} ${course.creator_last_name}` : null,
      lessonCount: parseInt(course.lesson_count),
      enrollmentCount: parseInt(course.enrollment_count),
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }));

    const response = { courses };
    
    // Only include pagination info if paginating
    if (shouldPaginate) {
      response.pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      };
    } else {
      response.total = total;
    }

    res.json(response);
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
      duration: course.duration,
      type: course.type,
      status: course.status,
      category: course.category,
      prerequisites: course.prerequisites,
      prerequisiteCourseId: course.prerequisite_course_id,
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
    const { title, description, thumbnailUrl, price, durationHours, duration, status, category, type, prerequisites, prerequisiteCourseId } = req.body;

    const result = await pool.query(
      `INSERT INTO courses (title, description, thumbnail_url, price, duration_hours, duration, status, category, type, prerequisites, prerequisite_course_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [title, description, thumbnailUrl, price || 0, durationHours || 0, duration, status || 'active', category, type || 'self', prerequisites, prerequisiteCourseId, req.user.id]
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
        duration: course.duration,
        type: course.type,
        status: course.status,
        category: course.category,
        prerequisites: course.prerequisites,
        prerequisiteCourseId: course.prerequisite_course_id,
        createdAt: course.created_at
      }
    });

    // Notify admins - Fire and forget/Log error, don't block response or trigger main catch
    notifyAdmins(
      'New Course Created',
      `Course "${course.title}" has been created by ${req.user.first_name} ${req.user.last_name}`,
      'info',
      `/admin/courses`
    ).catch(err => console.error('Notification error:', err));

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, thumbnailUrl, price, durationHours, duration, status, category, type, prerequisites, prerequisiteCourseId } = req.body;

    // Check permission for facilitator
    if (req.user.role === 'facilitator') {
      const accessCheck = await pool.query(
        `SELECT 1 FROM facilitator_courses WHERE user_id = $1 AND course_id = $2
         UNION
         SELECT 1 FROM courses WHERE id = $2 AND created_by = $1`,
        [req.user.id, id]
      );
      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Not authorized to manage this course' });
      }
    }

    const result = await pool.query(
      `UPDATE courses 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           thumbnail_url = COALESCE($3, thumbnail_url),
           price = COALESCE($4, price),
           duration_hours = COALESCE($5, duration_hours),
           duration = COALESCE($6, duration),
           status = COALESCE($7, status),
           category = COALESCE($8, category),
           type = COALESCE($9, type),
           prerequisites = COALESCE($10, prerequisites),
           prerequisite_course_id = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [title, description, thumbnailUrl, price, durationHours, duration, status, category, type, prerequisites, prerequisiteCourseId, id]
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
        duration: course.duration,
        type: course.type,
        status: course.status,
        category: course.category,
        prerequisites: course.prerequisites,
        prerequisiteCourseId: course.prerequisite_course_id,
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

    // First, check if course exists
    const courseCheck = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get all lessons with audio URLs for this course before cascade delete
    const lessonsResult = await pool.query(
      'SELECT audio_url FROM lessons WHERE course_id = $1 AND audio_url IS NOT NULL',
      [id]
    );

    // Delete all audio files from R2
    if (lessonsResult.rows.length > 0) {
      console.log(`Deleting ${lessonsResult.rows.length} audio files from R2 for course ${id}`);
      for (const lesson of lessonsResult.rows) {
        const key = getR2KeyFromUrl(lesson.audio_url);
        if (key) {
          try {
            console.log('Deleting audio from R2:', key);
            await r2.send(new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_AUDIOS,
              Key: key
            }));
          } catch (deleteError) {
            console.error('Failed to delete audio from R2:', deleteError);
            // Continue with other deletions
          }
        }
      }
    }

    // Now delete the course (lessons will be cascade deleted by database)
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);

    res.json({ message: 'Course and associated lessons deleted' });
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
        COUNT(*) FILTER (WHERE status = 'active' OR status = 'published') as active,
        COUNT(*) FILTER (WHERE type = 'self') as "selfPaced",
        COUNT(*) FILTER (WHERE type = 'onsite') as onsite
      FROM courses
    `);

    // Ensure numbers are integers (Postgres COUNT returns bigint which pg driver parses as string sometimes, or handled by json)
    // Actually pg driver parses count as string usually.
    // Let's map it safely.
    const row = stats.rows[0];
    const safeStats = {
      total: parseInt(row.total) || 0,
      active: parseInt(row.active) || 0,
      selfPaced: parseInt(row.selfPaced) || 0,
      onsite: parseInt(row.onsite) || 0
    };

    res.json(safeStats);
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
