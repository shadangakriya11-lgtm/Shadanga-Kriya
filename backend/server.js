require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');
const courseRoutes = require('./routes/course.routes.js');
const lessonRoutes = require('./routes/lesson.routes.js');
const enrollmentRoutes = require('./routes/enrollment.routes.js');
const progressRoutes = require('./routes/progress.routes.js');
const paymentRoutes = require('./routes/payment.routes.js');
const sessionRoutes = require('./routes/session.routes.js');
const attendanceRoutes = require('./routes/attendance.routes.js');
const analyticsRoutes = require('./routes/analytics.routes.js');
const settingsRoutes = require('./routes/settings.routes.js');
const notificationRoutes = require('./routes/notification.routes.js');

const app = express();

// Trust proxy - required for rate limiting behind reverse proxy (nginx, load balancer)
// Set to 1 if behind one proxy, or 'loopback' for local development
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : 'loopback');

// Middleware
// Request logging
app.use(morgan('combined'));

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// ===== RATE LIMITING (per express-rate-limit v8 documentation) =====

// General API rate limiter - 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Use 'limit' (v7+) instead of 'max'
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: 'draft-8', // draft-8 is the latest standard (RateLimit header)
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Less aggressive IPv6 subnet handling
  ipv6Subnet: 60,
});

// Strict rate limiter for login endpoint - 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  message: { error: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins (important for UX)
  ipv6Subnet: 60,
});

// Registration limiter - 3 accounts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  message: { error: 'Too many accounts created, please try again after an hour.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 60,
});

// Password reset limiter - prevent abuse of reset functionality
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  message: { error: 'Too many password reset attempts, please try again later.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 60,
});

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// Health check (no rate limit)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes with specific rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
