const jwt = require('jsonwebtoken');
const pool = require('../config/db.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database with permissions
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.status, 
              array_remove(array_agg(sap.permission), NULL) as permissions
       FROM users u
       LEFT JOIN sub_admin_permissions sap ON u.id = sap.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (result.rows[0].status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user has required role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = requireRole('admin');

// Check if user is facilitator or admin
const isFacilitatorOrAdmin = requireRole('admin', 'facilitator');

// Check if user is learner
const isLearner = requireRole('learner');

// Check for specific permission (for sub-admins)
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Sub-admin must have specific permission
    if (req.user.role === 'sub_admin') {
      if (req.user.permissions && req.user.permissions.includes(permission)) {
        return next();
      }
    }

    return res.status(403).json({ error: `Permission denied: ${permission} required` });
  };
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  isAdmin,
  isFacilitatorOrAdmin,
  isLearner,
  requirePermission,
  optionalAuth
};
