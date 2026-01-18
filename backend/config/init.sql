-- Initialize database schema for Therapy LMS

-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'facilitator', 'sub_admin', 'learner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived', 'active', 'locked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE course_type AS ENUM ('self', 'onsite');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lesson_status AS ENUM ('locked', 'active', 'in_progress', 'completed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  user_id VARCHAR(50) UNIQUE,
  role user_role NOT NULL DEFAULT 'learner',
  status user_status NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  phone VARCHAR(20),
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  referred_by_code_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table (separate for security)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'learner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  duration VARCHAR(50),
  duration_hours INTEGER DEFAULT 0,
  type course_type DEFAULT 'self',
  status course_status NOT NULL DEFAULT 'active',
  category VARCHAR(100),
  prerequisites TEXT,
  prerequisite_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Offline/Download control settings
  -- allow_offline_download BOOLEAN DEFAULT true,
  -- enforce_flight_mode BOOLEAN DEFAULT true,
  -- enforce_headphones BOOLEAN DEFAULT true,
  -- max_devices_per_user INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  audio_url TEXT,
  video_url TEXT,
  duration VARCHAR(50),
  duration_seconds INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  max_pauses INTEGER DEFAULT 3,
  is_locked BOOLEAN DEFAULT false,
  -- Offline/Download control settings (NULL = inherit from course)
  allow_offline_download BOOLEAN DEFAULT NULL,
  enforce_flight_mode BOOLEAN DEFAULT NULL,
  enforce_headphones BOOLEAN DEFAULT NULL,
  -- Access code settings
  access_code VARCHAR(10),
  access_code_type VARCHAR(20) DEFAULT 'permanent',
  access_code_expires_at TIMESTAMP WITH TIME ZONE,
  access_code_generated_at TIMESTAMP WITH TIME ZONE,
  access_code_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percent INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Lesson Progress table with pause tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  status lesson_status DEFAULT 'locked',
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
    current_time_seconds INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  pauses_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Pre-lesson protocol completion tracking
CREATE TABLE IF NOT EXISTS protocol_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  flight_mode_enabled BOOLEAN DEFAULT false,
  earbuds_connected BOOLEAN DEFAULT false,
  focus_acknowledged BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table (for facilitator-led sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  facilitator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location VARCHAR(255),
  max_participants INTEGER DEFAULT 30,
  status session_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'pending',
  marked_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(session_id, user_id)
);

-- Sub-admins permissions table
CREATE TABLE IF NOT EXISTS sub_admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  permission VARCHAR(100) NOT NULL,
  locations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session bookings table (for learners to book facilitator-led sessions)
CREATE TABLE IF NOT EXISTS session_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'booked',
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, user_id)
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pdf_url TEXT,
  UNIQUE(user_id, course_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(type);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_facilitator_id ON sessions(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_session_bookings_user_id ON session_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_session_id ON session_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);

-- Offline downloads table (tracks encrypted audio downloads)
CREATE TABLE IF NOT EXISTS offline_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  encryption_key_hash VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active',
  UNIQUE(user_id, lesson_id, device_id)
);

-- Device registrations table (for key derivation)
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  platform VARCHAR(50),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_offline_downloads_user_id ON offline_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_downloads_lesson_id ON offline_downloads(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON admin_settings(setting_key);

-- Referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code INTEGER NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_created_by ON referral_codes(created_by);

-- Add foreign key for referred_by_code_id after referral_codes table exists
ALTER TABLE users ADD CONSTRAINT fk_users_referred_by_code 
  FOREIGN KEY (referred_by_code_id) REFERENCES referral_codes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_referred_by_code_id ON users(referred_by_code_id);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, user_id, role, status)
VALUES ('admin@therapy.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'USR-2024-000001', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert role for admin
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE email = 'admin@therapy.com'
ON CONFLICT DO NOTHING;

-- Insert sample facilitator (password: facilitator123)
INSERT INTO users (email, password_hash, first_name, last_name, user_id, role, status)
VALUES ('facilitator@therapy.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Emily', 'Watson', 'USR-2024-000002', 'facilitator', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'facilitator' FROM users WHERE email = 'facilitator@therapy.com'
ON CONFLICT DO NOTHING;

-- Insert sample learner (password: learner123)
INSERT INTO users (email, password_hash, first_name, last_name, user_id, role, status)
VALUES ('sarah@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Mitchell', 'USR-2024-000003', 'learner', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'learner' FROM users WHERE email = 'sarah@example.com'
ON CONFLICT DO NOTHING;

-- Insert sample courses
INSERT INTO courses (title, description, type, status, price, duration)
VALUES 
  ('Foundations of Mindful Breathing', 'Master the fundamental techniques of therapeutic breathing. This structured protocol guides you through progressive exercises designed to establish a strong foundation for your healing journey.', 'self', 'active', 149, '6 hours'),
  ('Stress Response Protocol', 'A clinically-designed audio program to help regulate your nervous system response to stress triggers. Complete in a distraction-free environment.', 'self', 'active', 99, '4 hours'),
  ('Guided Recovery Sessions', 'Facilitated on-site therapy sessions with professional guidance. Attendance and completion verified by your assigned facilitator.', 'onsite', 'active', 299, '8 hours'),
  ('Sleep Restoration Program', 'Evening protocols designed to prepare your mind and body for restorative sleep. Best completed 30 minutes before bedtime.', 'self', 'active', 0, '5 hours')
ON CONFLICT DO NOTHING;

-- Insert sample lessons for first course
INSERT INTO lessons (course_id, title, description, duration, duration_seconds, order_index, max_pauses)
SELECT c.id, l.title, l.description, l.duration, l.duration_seconds, l.order_index, l.max_pauses
FROM courses c
CROSS JOIN (VALUES
  ('Introduction to Therapeutic Breathing', 'Understanding the science behind breath-based therapy', '15 min', 900, 0, 3),
  ('Diaphragmatic Breathing Basics', 'Learn the foundation of deep breathing techniques', '20 min', 1200, 1, 3),
  ('Rhythmic Breath Patterns', 'Establishing consistent breathing rhythms', '25 min', 1500, 2, 3),
  ('Breath Awareness Meditation', 'Combining breath with mindful awareness', '30 min', 1800, 3, 3),
  ('The 4-7-8 Technique', 'Mastering the calming breath pattern', '25 min', 1500, 4, 3),
  ('Box Breathing Protocol', 'Structured breathing for stress management', '20 min', 1200, 5, 3)
) AS l(title, description, duration, duration_seconds, order_index, max_pauses)
WHERE c.title = 'Foundations of Mindful Breathing'
ON CONFLICT DO NOTHING;
