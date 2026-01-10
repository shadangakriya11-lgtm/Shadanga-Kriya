const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db.js');
const { notifyAdmins } = require('./notification.controller.js');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

// SECURITY: Enforce JWT secret requirement
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// SECURITY: Audit logging helper
const logSecurityEvent = (event, details, req) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip: req?.ip || req?.connection?.remoteAddress || 'unknown',
    userAgent: req?.get?.('user-agent') || 'unknown',
    ...details
  };
  console.log('[SECURITY]', JSON.stringify(logEntry));
};

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // SECURITY: Public registration is ONLY for learners
    // Admin and Facilitator accounts must be created by an existing admin
    const assignedRole = 'learner';

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, email, first_name, last_name, role, status, created_at`,
      [email.toLowerCase(), passwordHash, firstName, lastName, assignedRole]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Notify admins
    notifyAdmins(
      'New User Registration',
      `New user ${user.first_name} ${user.last_name} (${user.email}) has registered.`,
      'info',
      `/admin/users`
    ).catch(err => console.error('Notification error', err));

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = email.toLowerCase();

    // SECURITY: Check for account lockout
    const lockoutCheck = await pool.query(
      `SELECT login_attempts, locked_until FROM users WHERE email = $1`,
      [identifier]
    );

    if (lockoutCheck.rows.length > 0) {
      const { login_attempts, locked_until } = lockoutCheck.rows[0];

      if (locked_until && new Date(locked_until) > new Date()) {
        const remainingTime = Math.ceil((new Date(locked_until) - new Date()) / 1000);
        return res.status(429).json({
          error: 'Account temporarily locked due to multiple failed login attempts',
          retryAfter: remainingTime
        });
      }
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check status
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      // SECURITY: Record failed login attempt
      const newAttempts = (user.login_attempts || 0) + 1;
      const lockoutTime = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await pool.query(
        `UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3`,
        [newAttempts, lockoutTime, user.id]
      );

      // SECURITY: Log failed login attempt
      logSecurityEvent('LOGIN_FAILED', {
        email: identifier,
        userId: user.id,
        attempts: newAttempts,
        locked: !!lockoutTime
      }, req);

      if (lockoutTime) {
        return res.status(429).json({
          error: 'Account locked due to multiple failed login attempts. Try again in 15 minutes.'
        });
      }

      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsRemaining: Math.max(0, 5 - newAttempts)
      });
    }

    // SECURITY: Reset login attempts on successful login
    await pool.query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, last_active = NOW() WHERE id = $1',
      [user.id]
    );

    // SECURITY: Log successful login
    logSecurityEvent('LOGIN_SUCCESS', {
      email: identifier,
      userId: user.id,
      role: user.role
    }, req);

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, status, avatar_url, phone, created_at, last_active
       FROM users WHERE id = $1`,
      [req.user.id]
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
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, avatarUrl } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, first_name, last_name, role, avatar_url, phone`,
      [firstName, lastName, phone, avatarUrl, req.user.id]
    );

    const user = result.rows[0];

    res.json({
      message: 'Profile updated',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Generate random token
const generateResetToken = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Request password reset (forgot password)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, email, first_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({
        message: 'If this email exists, a reset link has been sent.',
        // For demo purposes, indicate user not found (remove in production)
        demo_note: 'User not found - no email sent'
      });
    }

    const user = result.rows[0];

    // Invalidate any existing tokens for this user
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
      [user.id]
    );

    // Generate new token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Store token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    // In production, send email with reset link
    // For now, log it server-side only
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    console.log(`[PASSWORD_RESET] Reset link for ${email}: ${resetLink}`);

    // SECURITY: Never expose tokens in API response
    res.json({
      message: 'If this email exists, a reset link has been sent to your email address.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // SECURITY: Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'Password must contain uppercase, lowercase, number, and special character'
      });
    }

    // Find valid token
    const tokenResult = await pool.query(
      `SELECT prt.*, u.email, u.first_name 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1 AND prt.used = false AND prt.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetData = tokenResult.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update user password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, resetData.user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [resetData.id]
    );

    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};
