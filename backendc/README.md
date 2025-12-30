# Therapy LMS Backend

A scalable Node.js backend for the Therapy Learning Management System with Admin, Facilitator, and Learner panels.

## Setup

### 1. Install Dependencies

```bash
cd backendc
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backendc` folder:

```env
DATABASE_URL=postgresql://user:password@your-neon-host:5432/your-db?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=4000
FRONTEND_URL=http://localhost:8080
```

### 3. Initialize Database

Run the SQL in `config/init.sql` on your Neon database to create all tables.

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Courses
- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Get course details
- `GET /api/courses/stats` - Get course stats (admin)
- `POST /api/courses` - Create course (admin/facilitator)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course (admin)

### Lessons
- `GET /api/lessons/course/:courseId` - Get lessons by course
- `GET /api/lessons/:id` - Get lesson details
- `POST /api/lessons` - Create lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson
- `PUT /api/lessons/course/:courseId/reorder` - Reorder lessons

### Enrollments
- `GET /api/enrollments/my` - Get my enrollments
- `POST /api/enrollments` - Enroll in course
- `DELETE /api/enrollments/:courseId` - Unenroll
- `GET /api/enrollments` - All enrollments (admin)
- `GET /api/enrollments/stats` - Stats (admin)

### Progress
- `GET /api/progress/my` - Get overall progress
- `GET /api/progress/course/:courseId` - Get course progress
- `PUT /api/progress/lesson/:lessonId` - Update lesson progress
- `GET /api/progress/all` - All users progress (admin)

### Payments
- `GET /api/payments/my` - Get my payments
- `POST /api/payments` - Create payment
- `POST /api/payments/:paymentId/complete` - Complete payment
- `GET /api/payments` - All payments (admin)
- `GET /api/payments/stats` - Payment stats (admin)
- `POST /api/payments/:paymentId/refund` - Refund (admin)

### Sessions (Facilitator)
- `GET /api/sessions` - All sessions (admin)
- `GET /api/sessions/my` - My sessions (facilitator)
- `GET /api/sessions/:id` - Session details
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/sessions/:id/start` - Start session
- `POST /api/sessions/:id/end` - End session

### Attendance
- `GET /api/attendance/session/:sessionId` - Get session attendance
- `POST /api/attendance/session/:sessionId` - Add attendee
- `PUT /api/attendance/session/:sessionId/user/:userId` - Mark attendance
- `PUT /api/attendance/session/:sessionId/bulk` - Bulk mark
- `DELETE /api/attendance/session/:sessionId/user/:userId` - Remove attendee
- `GET /api/attendance/user/:userId` - User history (admin)

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats (admin)
- `GET /api/analytics/enrollments` - Enrollment trends (admin)
- `GET /api/analytics/revenue` - Revenue analytics (admin)
- `GET /api/analytics/course/:courseId` - Course analytics (admin)
- `GET /api/analytics/facilitator` - Facilitator stats
- `GET /api/analytics/learner/:learnerId?` - Learner stats

## Default Admin Credentials

After running init.sql:
- Email: `admin@therapy.com`
- Password: `admin123`

## Architecture

```
backendc/
├── config/
│   ├── db.js           # Database connection
│   └── init.sql        # Database schema
├── controllers/        # Business logic
├── middleware/         # Auth & validation
├── routes/            # API routes
├── server.js          # Entry point
└── package.json
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with express-validator
- Role-based access control (admin, facilitator, learner)
- SQL injection protection via parameterized queries
