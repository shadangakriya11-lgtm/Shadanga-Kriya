export type CourseStatus = "active" | "completed" | "locked" | "pending";
export type CourseType = "self" | "onsite";
export type LessonStatus = "active" | "completed" | "locked" | "skipped";
export type UserRole = "learner" | "admin" | "facilitator" | "sub_admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  lastActive?: Date;
  isActive: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  type: CourseType;
  status: CourseStatus;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  duration: string;
  thumbnail?: string;
  price?: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  status: LessonStatus;
  order: number;
  maxPauses: number;
  pausesUsed: number;
  audioUrl?: string;
  // Access Code fields
  accessCodeEnabled?: boolean;
  hasAccessCode?: boolean;
  accessCodeType?: "permanent" | "temporary";
  accessCodeExpired?: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  pausesRemaining: number;
  isPaused: boolean;
}

export interface PreLessonChecklist {
  flightModeEnabled: boolean;
  earbudsConnected: boolean;
  focusAcknowledged: boolean;
}

// API Response Types
export interface AuthResponse {
  user: User;
  token: string;
}

// ProfileResponse is the user object directly (not wrapped)
export type ProfileResponse = User;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationMeta;
}

export interface CoursesResponse {
  courses: Course[];
  pagination: PaginationMeta;
}

export interface LessonsResponse {
  lessons: Lesson[];
}

export interface EnrollmentsResponse {
  enrollments: Enrollment[];
  pagination?: PaginationMeta;
}

export interface PaymentsResponse {
  payments: Payment[];
  pagination: PaginationMeta;
}

export interface SessionsResponse {
  sessions: Session[];
}

export interface AttendanceResponse {
  attendance: Attendance[];
  stats: AttendanceStats;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface SettingsResponse {
  settings: Settings;
}

export interface RazorpayKeyResponse {
  keyId: string;
}

export interface StatsResponse {
  [key: string]: number | string | Record<string, unknown>;
}

export interface AnalyticsDashboard {
  [key: string]: number | string | Record<string, unknown>;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  enrolledAt: Date;
  course?: Course;
  user?: User;
}

export interface Payment {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  paymentMethod?: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  courseId: string;
  facilitatorId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "active" | "completed";
  location?: string;
}

export interface Attendance {
  id: string;
  sessionId: string;
  userId: string;
  status: "present" | "absent";
  markedAt: Date;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Settings {
  id: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: string | undefined;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateCourseData {
  title: string;
  description: string;
  type: CourseType;
  price?: number;
  duration?: string;
  thumbnail?: string;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  type?: CourseType;
  price?: number;
  duration?: string;
  thumbnail?: string;
  status?: CourseStatus;
}

export interface CreateLessonData {
  courseId: string;
  title: string;
  description: string;
  duration: string;
  order: number;
  maxPauses?: number;
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  duration?: string;
  order?: number;
  maxPauses?: number;
}

export interface ProgressUpdateData {
  completed?: boolean;
  currentTime?: number;
  pausesUsed?: number;
}

export interface ActivatePaymentData {
  userId: string;
  courseId: string;
  notes?: string;
}

export interface CreateSessionData {
  courseId: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
}

export interface UpdateSessionData {
  title?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  location?: string;
  status?: "scheduled" | "active" | "completed";
}

export interface BulkAttendanceData {
  userId: string;
  status: "present" | "absent";
}

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: string;
}

export interface UpdateSettingsData {
  [key: string]: string | number | boolean;
}
