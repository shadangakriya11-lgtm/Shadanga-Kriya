require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
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
