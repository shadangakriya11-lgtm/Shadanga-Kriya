const bcrypt = require('bcryptjs');
const pool = require('../config/db.js');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.status, u.avatar_url, u.phone, u.created_at, u.last_active,
             array_remove(array_agg(sap.permission), NULL) as permissions
      FROM users u
      LEFT JOIN sub_admin_permissions sap ON u.id = sap.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (status) {
      query += ` AND u.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` GROUP BY u.id`;

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT u.id) FROM users u WHERE ${query.split('WHERE')[1].split('GROUP BY')[0]}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || 0);

    // Get paginated results
    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatar_url,
      phone: user.phone,
      createdAt: user.created_at,
      lastActive: user.last_active,
      permissions: user.permissions || []
    }));

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, status, avatar_url, phone, created_at, last_active
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatar_url,
      phone: user.phone,
      createdAt: user.created_at,
      lastActive: user.last_active
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Create user (admin only)
const createUser = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { email, password, firstName, lastName, role, status = 'active', phone, permissions } = req.body;

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password - SECURITY: Use 12 rounds for better security
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, status, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, role, status, phone, created_at`,
      [email.toLowerCase(), passwordHash, firstName, lastName, role, status, phone]
    );

    const user = result.rows[0];

    // Handle Sub-Admin Permissions (using parameterized queries to prevent SQL injection)
    let userPermissions = [];
    if ((role === 'sub_admin' || role === 'facilitator') && permissions && Array.isArray(permissions) && permissions.length > 0) {
      // Use parameterized query to prevent SQL injection
      const validPermissions = ['manage_users', 'manage_courses', 'manage_lessons', 'view_analytics', 'manage_sessions', 'manage_payments', 'manage_referrals'];
      const safePermissions = permissions.filter(p => validPermissions.includes(p));

      for (const permission of safePermissions) {
        await client.query(
          'INSERT INTO sub_admin_permissions (user_id, permission) VALUES ($1, $2)',
          [user.id, permission]
        );
      }
      userPermissions = safePermissions;
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'User created',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        phone: user.phone,
        createdAt: user.created_at,
        permissions: userPermissions
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    client.release();
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { firstName, lastName, role, status, phone, avatarUrl, permissions, password } = req.body;

    // 1. If password is provided, hash it and update separately
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, id]
      );
    }

    // 2. Update User Basic Info
    const result = await client.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           role = COALESCE($3, role),
           status = COALESCE($4, status),
           phone = COALESCE($5, phone),
           avatar_url = COALESCE($6, avatar_url),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, email, first_name, last_name, role, status, phone, avatar_url`,
      [firstName, lastName, role, status, phone, avatarUrl, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // 3. Handle Permissions (if role is sub_admin/facilitator OR just updating permissions for existing user)
    // If permissions array is provided, we replace existing permissions.
    let currentPermissions = [];
    if (permissions && Array.isArray(permissions)) {
      // Delete existing
      await client.query('DELETE FROM sub_admin_permissions WHERE user_id = $1', [id]);

      if (permissions.length > 0) {
        // Use parameterized query to prevent SQL injection
        const validPermissions = ['manage_users', 'manage_courses', 'manage_lessons', 'view_analytics', 'manage_sessions', 'manage_payments', 'manage_referrals'];
        const safePermissions = permissions.filter(p => validPermissions.includes(p));

        for (const permission of safePermissions) {
          await client.query(
            'INSERT INTO sub_admin_permissions (user_id, permission) VALUES ($1, $2)',
            [id, permission]
          );
        }
        currentPermissions = safePermissions;
      }
    } else {
      // Fetch existing if not updated
      const permResult = await client.query('SELECT permission FROM sub_admin_permissions WHERE user_id = $1', [id]);
      currentPermissions = permResult.rows.map(r => r.permission);
    }

    await client.query('COMMIT');

    res.json({
      message: 'User updated',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        permissions: currentPermissions
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  } finally {
    client.release();
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get user stats (admin)
const getUserStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE role = 'learner') as learners,
        COUNT(*) FILTER (WHERE role = 'facilitator') as facilitators,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week
      FROM users
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
};
