const pool = require('../config/db');

/**
 * Create a discount code
 * POST /api/discounts
 */
exports.createDiscountCode = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { code, discountPercent, expiresAt, courseIds, maxUsage } = req.body;
    const createdBy = req.user.id;

    // Validation
    if (!code || !discountPercent || !expiresAt || !courseIds || courseIds.length === 0) {
      return res.status(400).json({ 
        error: 'Code, discount percent, expiry date, and at least one course are required' 
      });
    }

    if (discountPercent < 1 || discountPercent > 100) {
      return res.status(400).json({ 
        error: 'Discount percent must be between 1 and 100' 
      });
    }

    // Check if code already exists
    const existingCode = await client.query(
      'SELECT id FROM discount_codes WHERE UPPER(code) = UPPER($1)',
      [code]
    );

    if (existingCode.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Discount code already exists' 
      });
    }

    await client.query('BEGIN');

    // Create discount code
    const result = await client.query(
      `INSERT INTO discount_codes 
        (code, discount_percent, expires_at, max_usage, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [code.toUpperCase(), discountPercent, expiresAt, maxUsage || null, createdBy]
    );

    const discountCodeId = result.rows[0].id;

    // Link courses to discount code
    for (const courseId of courseIds) {
      await client.query(
        `INSERT INTO discount_code_courses (discount_code_id, course_id) 
         VALUES ($1, $2)`,
        [discountCodeId, courseId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Discount code created successfully',
      discountCode: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating discount code:', error);
    res.status(500).json({ 
      error: 'Failed to create discount code' 
    });
  } finally {
    client.release();
  }
};

/**
 * Get all discount codes (Admin only)
 * GET /api/discounts
 */
exports.getAllDiscountCodes = async (req, res) => {
  try {
    const { includeExpired = 'false' } = req.query;

    let query = `
      SELECT 
        dc.*,
        u.first_name || ' ' || u.last_name as created_by_name,
        COUNT(DISTINCT dcc.course_id) as course_count,
        array_agg(DISTINCT jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'price', c.price
        )) FILTER (WHERE c.id IS NOT NULL) as courses
      FROM discount_codes dc
      LEFT JOIN users u ON dc.created_by = u.id
      LEFT JOIN discount_code_courses dcc ON dc.id = dcc.discount_code_id
      LEFT JOIN courses c ON dcc.course_id = c.id
    `;

    if (includeExpired === 'false') {
      query += ` WHERE dc.expires_at > NOW()`;
    }

    query += `
      GROUP BY dc.id, u.first_name, u.last_name
      ORDER BY dc.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      discountCodes: result.rows
    });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch discount codes' 
    });
  }
};

/**
 * Get discount code by ID
 * GET /api/discounts/:id
 */
exports.getDiscountCodeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        dc.*,
        u.first_name || ' ' || u.last_name as created_by_name,
        array_agg(DISTINCT dcc.course_id) FILTER (WHERE dcc.course_id IS NOT NULL) as course_ids,
        array_agg(DISTINCT jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'price', c.price
        )) FILTER (WHERE c.id IS NOT NULL) as courses
      FROM discount_codes dc
      LEFT JOIN users u ON dc.created_by = u.id
      LEFT JOIN discount_code_courses dcc ON dc.id = dcc.discount_code_id
      LEFT JOIN courses c ON dcc.course_id = c.id
      WHERE dc.id = $1
      GROUP BY dc.id, u.first_name, u.last_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Discount code not found' 
      });
    }

    res.json({
      discountCode: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching discount code:', error);
    res.status(500).json({ 
      error: 'Failed to fetch discount code' 
    });
  }
};

/**
 * Update discount code
 * PUT /api/discounts/:id
 */
exports.updateDiscountCode = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { code, discountPercent, expiresAt, courseIds, maxUsage, isActive } = req.body;

    await client.query('BEGIN');

    // Build update query dynamically
    const updates = [];
    const params = [id];
    let paramCount = 2;

    if (code !== undefined) {
      // Check if new code already exists (excluding current)
      const existingCode = await client.query(
        'SELECT id FROM discount_codes WHERE UPPER(code) = UPPER($1) AND id != $2',
        [code, id]
      );
      if (existingCode.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Discount code already exists' });
      }
      updates.push(`code = $${paramCount}`);
      params.push(code.toUpperCase());
      paramCount++;
    }

    if (discountPercent !== undefined) {
      if (discountPercent < 1 || discountPercent > 100) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Discount percent must be between 1 and 100' });
      }
      updates.push(`discount_percent = $${paramCount}`);
      params.push(discountPercent);
      paramCount++;
    }

    if (expiresAt !== undefined) {
      updates.push(`expires_at = $${paramCount}`);
      params.push(expiresAt);
      paramCount++;
    }

    if (maxUsage !== undefined) {
      updates.push(`max_usage = $${paramCount}`);
      params.push(maxUsage || null);
      paramCount++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      params.push(isActive);
      paramCount++;
    }

    updates.push('updated_at = NOW()');

    if (updates.length > 1) { // More than just updated_at
      const updateQuery = `
        UPDATE discount_codes 
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      await client.query(updateQuery, params);
    }

    // Update course associations if provided
    if (courseIds !== undefined && Array.isArray(courseIds)) {
      // Delete existing associations
      await client.query(
        'DELETE FROM discount_code_courses WHERE discount_code_id = $1',
        [id]
      );

      // Add new associations
      for (const courseId of courseIds) {
        await client.query(
          'INSERT INTO discount_code_courses (discount_code_id, course_id) VALUES ($1, $2)',
          [id, courseId]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch updated discount code
    const result = await client.query(
      `SELECT 
        dc.*,
        array_agg(DISTINCT dcc.course_id) FILTER (WHERE dcc.course_id IS NOT NULL) as course_ids
      FROM discount_codes dc
      LEFT JOIN discount_code_courses dcc ON dc.id = dcc.discount_code_id
      WHERE dc.id = $1
      GROUP BY dc.id`,
      [id]
    );

    res.json({
      success: true,
      message: 'Discount code updated successfully',
      discountCode: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating discount code:', error);
    res.status(500).json({ 
      error: 'Failed to update discount code' 
    });
  } finally {
    client.release();
  }
};

/**
 * Delete discount code
 * DELETE /api/discounts/:id
 */
exports.deleteDiscountCode = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM discount_codes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Discount code not found' 
      });
    }

    res.json({
      success: true,
      message: 'Discount code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    res.status(500).json({ 
      error: 'Failed to delete discount code' 
    });
  }
};

/**
 * Validate discount code (for learner use - future implementation)
 * POST /api/discounts/validate
 */
exports.validateDiscountCode = async (req, res) => {
  try {
    const { code, courseId } = req.body;
    const userId = req.user?.id;

    if (!code || !courseId) {
      return res.status(400).json({ 
        error: 'Code and course ID are required' 
      });
    }

    // Get discount code with course check
    const result = await pool.query(
      `SELECT 
        dc.*,
        EXISTS(
          SELECT 1 FROM discount_code_courses dcc 
          WHERE dcc.discount_code_id = dc.id AND dcc.course_id = $2
        ) as applies_to_course
      FROM discount_codes dc
      WHERE UPPER(dc.code) = UPPER($1)
        AND dc.is_active = true
        AND dc.expires_at > NOW()`,
      [code, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        valid: false,
        error: 'Invalid or expired discount code' 
      });
    }

    const discountCode = result.rows[0];

    if (!discountCode.applies_to_course) {
      return res.status(400).json({ 
        valid: false,
        error: 'This discount code does not apply to the selected course' 
      });
    }

    // Check max usage
    if (discountCode.max_usage && discountCode.usage_count >= discountCode.max_usage) {
      return res.status(400).json({ 
        valid: false,
        error: 'This discount code has reached its usage limit' 
      });
    }

    // Check if user already used this code for this course
    if (userId) {
      const usageCheck = await pool.query(
        `SELECT id FROM discount_code_usage 
         WHERE discount_code_id = $1 AND user_id = $2 AND course_id = $3`,
        [discountCode.id, userId, courseId]
      );

      if (usageCheck.rows.length > 0) {
        return res.status(400).json({ 
          valid: false,
          error: 'You have already used this discount code for this course' 
        });
      }
    }

    res.json({
      valid: true,
      discountCode: {
        id: discountCode.id,
        code: discountCode.code,
        discountPercent: discountCode.discount_percent,
        expiresAt: discountCode.expires_at
      }
    });
  } catch (error) {
    console.error('Error validating discount code:', error);
    res.status(500).json({ 
      error: 'Failed to validate discount code' 
    });
  }
};
