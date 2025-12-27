export type CourseStatus = 'active' | 'completed' | 'locked' | 'pending';
export type CourseType = 'self' | 'onsite';
export type LessonStatus = 'active' | 'completed' | 'locked' | 'skipped';
export type UserRole = 'learner' | 'admin' | 'subadmin';

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
