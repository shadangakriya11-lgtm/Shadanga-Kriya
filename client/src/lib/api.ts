import type {
  AuthResponse,
  ProfileResponse,
  UpdateProfileData,
  UsersResponse,
  User,
  CreateUserData,
  UpdateUserData,
  StatsResponse,
  CoursesResponse,
  Course,
  CreateCourseData,
  UpdateCourseData,
  LessonsResponse,
  Lesson,
  CreateLessonData,
  UpdateLessonData,
  EnrollmentsResponse,
  Enrollment,
  ProgressUpdateData,
  PaymentsResponse,
  Payment,
  ActivatePaymentData,
  SessionsResponse,
  Session,
  CreateSessionData,
  UpdateSessionData,
  AttendanceResponse,
  BulkAttendanceData,
  AnalyticsDashboard,
  NotificationsResponse,
  Notification,
  CreateNotificationData,
  SettingsResponse,
  UpdateSettingsData,
  RazorpayKeyResponse,
} from "@/types";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

// Token storage key
const TOKEN_KEY = "shadanga_kriya_auth_token";
const PREFERENCES_GROUP = "ShadangaKriyaAuth";

// In-memory token cache for sync access
let tokenCache: string | null = null;

// Track initialization state
let isInitialized = false;

/**
 * Initialize token from persistent storage on app start
 * Per Capacitor docs: Preferences uses SharedPreferences (Android) / UserDefaults (iOS)
 * which persists across app restarts, unlike localStorage which can be evicted by OS
 */
export const initializeAuth = async (): Promise<boolean> => {
  // Prevent double initialization
  if (isInitialized) {
    console.log("[Auth] Already initialized, returning cached state");
    return !!tokenCache;
  }

  try {
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    console.log(
      "[Auth] Initializing auth on platform:",
      platform,
      "isNative:",
      isNative
    );

    if (isNative) {
      // Configure Preferences with a specific group for our app
      try {
        await Preferences.configure({ group: PREFERENCES_GROUP });
        console.log(
          "[Auth] Preferences configured with group:",
          PREFERENCES_GROUP
        );
      } catch (configError) {
        console.log(
          "[Auth] Could not configure Preferences group (may not be supported):",
          configError
        );
      }

      // Native: Try Capacitor Preferences first (SharedPreferences/UserDefaults)
      console.log("[Auth] Using Capacitor Preferences for native platform");
      const result = await Preferences.get({ key: TOKEN_KEY });
      tokenCache = result.value;
      console.log(
        "[Auth] Token from Preferences:",
        tokenCache ? `found (${tokenCache.substring(0, 20)}...)` : "not found"
      );

      // If not found in Preferences, try localStorage as fallback
      if (!tokenCache) {
        try {
          const localToken = localStorage.getItem(TOKEN_KEY);
          if (localToken) {
            console.log(
              "[Auth] Found token in localStorage backup, migrating to Preferences..."
            );
            tokenCache = localToken;
            // Migrate to Preferences
            await Preferences.set({ key: TOKEN_KEY, value: localToken });
            console.log("[Auth] Token migrated to Preferences");
          }
        } catch (e) {
          console.log("[Auth] localStorage fallback check failed:", e);
        }
      }

      // Debug: List all keys in Preferences
      try {
        const allKeys = await Preferences.keys();
        console.log("[Auth] All Preferences keys:", allKeys.keys);
      } catch (e) {
        console.log("[Auth] Could not list keys:", e);
      }
    } else {
      // Web: Use localStorage as fallback
      console.log("[Auth] Using localStorage for web platform");
      tokenCache = localStorage.getItem(TOKEN_KEY);
      console.log(
        "[Auth] Token from localStorage:",
        tokenCache ? `found (${tokenCache.substring(0, 20)}...)` : "not found"
      );
    }

    isInitialized = true;
    console.log("[Auth] Initialization complete. Has token:", !!tokenCache);
    return !!tokenCache;
  } catch (error) {
    console.error("[Auth] Failed to initialize auth:", error);
    isInitialized = true;
    return false;
  }
};

// Check if auth is initialized
export const isAuthInitialized = () => isInitialized;

/**
 * API Base URL Configuration
 *
 * For local testing:
 * - Web browser: http://localhost:4000/api
 * - Android Emulator: http://10.0.2.2:4000/api (10.0.2.2 routes to host machine)
 * - Physical Android device: http://YOUR_LOCAL_IP:4000/api (e.g., http://192.168.1.100:4000/api)
 *
 * For production, set VITE_API_URL in your .env file
 */
const getApiBaseUrl = (): string => {
  // Production URL from environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Local development
  if (import.meta.env.DEV) {
    // Check if running on native platform (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      // Android Emulator uses 10.0.2.2 to reach host machine's localhost
      // For physical device, replace with your computer's local IP
      // e.g., "http://192.168.1.100:4000/api"
      return "http://10.0.2.2:4000/api";
    }
    // Web browser
    return "http://localhost:4000/api";
  }

  // Fallback - update this with your production backend URL
  return "https://backend-serene-flow.onrender.com/api";
};

const API_BASE_URL = getApiBaseUrl();

// Get token from cache (sync) - cache is populated by initializeAuth
const getToken = () => tokenCache;

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    // Skip ngrok browser warning for free tier tunnels
    "ngrok-skip-browser-warning": "true",
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Parse response text once to avoid stream cloning issues
  const text = await response.text();
  let data: any = null;

  try {
    if (text && text.trim()) {
      data = JSON.parse(text);
    }
  } catch (e) {
    // Ignore parse errors, will fall back to text
  }

  if (!response.ok) {
    // Include status code in error message for auth error detection
    const errorMessage =
      (data && (data.error || data.message)) || text || "Request failed";
    throw new Error(`${response.status}: ${errorMessage}`);
  }

  // Prefer parsed JSON; otherwise return text as unknown
  if (data !== null) return data as T;
  return text as unknown as T;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: CreateUserData) =>
    apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProfile: () => apiRequest<ProfileResponse>("/auth/profile"),

  updateProfile: (data: UpdateProfileData) =>
    apiRequest<User>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Users API (Admin)
export const usersApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest<UsersResponse>(`/users${query}`);
  },
  getById: (id: string) => apiRequest<User>(`/users/${id}`),
  create: (data: CreateUserData) =>
    apiRequest<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateUserData) =>
    apiRequest<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/users/${id}`, { method: "DELETE" }),
  getStats: () => apiRequest<StatsResponse>("/users/stats"),
};

// Courses API
export const coursesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest<CoursesResponse>(`/courses${query}`);
  },
  getById: (id: string) => apiRequest<Course>(`/courses/${id}`),
  create: (data: CreateCourseData) =>
    apiRequest<Course>("/courses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateCourseData) =>
    apiRequest<Course>(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/courses/${id}`, { method: "DELETE" }),
  getStats: () => apiRequest<StatsResponse>("/courses/stats"),
};

// Lessons API
export const lessonsApi = {
  getByCourse: (courseId: string) =>
    apiRequest<LessonsResponse>(`/lessons/course/${courseId}`),
  getById: (id: string) => apiRequest<Lesson>(`/lessons/${id}`),
  create: (data: CreateLessonData | FormData) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return apiRequest<Lesson>("/lessons", { method: "POST", body });
  },
  update: (id: string, data: UpdateLessonData | FormData) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return apiRequest<Lesson>(`/lessons/${id}`, { method: "PUT", body });
  },
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/lessons/${id}`, { method: "DELETE" }),
  // Access Code Management
  getAccessCodeInfo: (lessonId: string) =>
    apiRequest<{
      lessonId: string;
      lessonTitle: string;
      accessCodeEnabled: boolean;
      hasAccessCode: boolean;
      accessCode: {
        code: string;
        type: "permanent" | "temporary";
        expiresAt: string | null;
        generatedAt: string;
        isExpired: boolean;
      } | null;
    }>(`/lessons/${lessonId}/access-code`),
  generateAccessCode: (
    lessonId: string,
    codeType: "permanent" | "temporary",
    expiresInMinutes?: number
  ) =>
    apiRequest<{
      message: string;
      accessCode: {
        code: string;
        type: string;
        expiresAt: string | null;
        generatedAt: string;
      };
    }>(`/lessons/${lessonId}/access-code`, {
      method: "POST",
      body: JSON.stringify({ codeType, expiresInMinutes }),
    }),
  toggleAccessCode: (lessonId: string, enabled: boolean) =>
    apiRequest<{
      message: string;
      lesson: { id: string; accessCodeEnabled: boolean };
    }>(`/lessons/${lessonId}/access-code/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  clearAccessCode: (lessonId: string) =>
    apiRequest<{ message: string }>(`/lessons/${lessonId}/access-code`, {
      method: "DELETE",
    }),
  verifyAccessCode: (lessonId: string, code: string) =>
    apiRequest<{ valid: boolean; message?: string; error?: string }>(
      `/lessons/${lessonId}/verify-access-code`,
      {
        method: "POST",
        body: JSON.stringify({ code }),
      }
    ),
};

// Enrollments API
export const enrollmentsApi = {
  getMy: () => apiRequest<EnrollmentsResponse>("/enrollments/my"),
  enroll: (courseId: string) =>
    apiRequest<Enrollment>("/enrollments", {
      method: "POST",
      body: JSON.stringify({ courseId }),
    }),
  unenroll: (courseId: string) =>
    apiRequest<{ message: string }>(`/enrollments/${courseId}`, {
      method: "DELETE",
    }),
  getAll: () => apiRequest<EnrollmentsResponse>("/enrollments"),
  getStats: () => apiRequest<StatsResponse>("/enrollments/stats"),
  // Admin functions
  getByCourse: (courseId: string) =>
    apiRequest<EnrollmentsResponse>(`/enrollments/course/${courseId}`),
  adminEnroll: (userId: string, courseId: string) =>
    apiRequest<Enrollment>("/enrollments/admin", {
      method: "POST",
      body: JSON.stringify({ userId, courseId }),
    }),
  adminUnenroll: (userId: string, courseId: string) =>
    apiRequest<{ message: string }>(
      `/enrollments/admin/${userId}/${courseId}`,
      {
        method: "DELETE",
      }
    ),
};

// Progress API
export const progressApi = {
  getMy: () => apiRequest<Record<string, unknown>>("/progress/my"),
  getCourse: (courseId: string) =>
    apiRequest<Record<string, unknown>>(`/progress/course/${courseId}`),
  updateLesson: (lessonId: string, data: ProgressUpdateData) =>
    apiRequest<Record<string, unknown>>(`/progress/lesson/${lessonId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  // Admin actions
  grantPause: (
    userId: string,
    lessonId: string,
    additionalPauses: number = 1
  ) =>
    apiRequest<Record<string, unknown>>(
      `/progress/${userId}/${lessonId}/grant-pause`,
      {
        method: "POST",
        body: JSON.stringify({ additionalPauses }),
      }
    ),
  resetLesson: (userId: string, lessonId: string) =>
    apiRequest<Record<string, unknown>>(
      `/progress/${userId}/${lessonId}/reset`,
      {
        method: "POST",
      }
    ),
  lockLesson: (userId: string, lessonId: string) =>
    apiRequest<Record<string, unknown>>(
      `/progress/${userId}/${lessonId}/lock`,
      {
        method: "POST",
      }
    ),
};

// Payments API
export const paymentsApi = {
  getMy: () => apiRequest<PaymentsResponse>("/payments/my"),
  create: (courseId: string, paymentMethod?: string) =>
    apiRequest<Payment>("/payments", {
      method: "POST",
      body: JSON.stringify({ courseId, paymentMethod }),
    }),
  complete: (paymentId: string) =>
    apiRequest<Payment>(`/payments/${paymentId}/complete`, {
      method: "POST",
      body: JSON.stringify({ status: "completed" }),
    }),
  getAll: () => apiRequest<PaymentsResponse>("/payments"),
  getStats: () => apiRequest<StatsResponse>("/payments/stats"),
  activate: (data: ActivatePaymentData) =>
    apiRequest<Payment>("/payments/activate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createRazorpayOrder: (courseId: string) =>
    apiRequest<{
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      courseTitle: string;
    }>("/payments/create-razorpay-order", {
      method: "POST",
      body: JSON.stringify({ courseId }),
    }),
  verifyRazorpay: (data: Record<string, string>) =>
    apiRequest<Payment>("/payments/verify-razorpay", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Sessions API
export const sessionsApi = {
  getAll: () => apiRequest<SessionsResponse>("/sessions"),
  getMy: () => apiRequest<SessionsResponse>("/sessions/my"),
  getById: (id: string) => apiRequest<Session>(`/sessions/${id}`),
  create: (data: CreateSessionData) =>
    apiRequest<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateSessionData) =>
    apiRequest<Session>(`/sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  start: (id: string) =>
    apiRequest<Session>(`/sessions/${id}/start`, { method: "POST" }),
  end: (id: string) =>
    apiRequest<Session>(`/sessions/${id}/end`, { method: "POST" }),
};

// Attendance API
export const attendanceApi = {
  getSession: (sessionId: string) =>
    apiRequest<AttendanceResponse>(`/attendance/session/${sessionId}`),
  getMy: (courseId: string) =>
    apiRequest<{
      hasSessionToday: boolean;
      isMarkedPresent: boolean;
      sessionId?: string;
      message: string;
    }>(`/attendance/my/${courseId}`),
  mark: (sessionId: string, userId: string, status: "present" | "absent") =>
    apiRequest<{ message: string }>(
      `/attendance/session/${sessionId}/user/${userId}`,
      { method: "PUT", body: JSON.stringify({ status }) }
    ),
  bulkMark: (sessionId: string, attendances: BulkAttendanceData[]) =>
    apiRequest<{ message: string }>(`/attendance/session/${sessionId}/bulk`, {
      method: "PUT",
      body: JSON.stringify({ attendances }),
    }),
  export: (sessionId: string) =>
    apiRequest<string>(`/attendance/export/${sessionId}`),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => apiRequest<AnalyticsDashboard>("/analytics/dashboard"),
  getEnrollmentTrends: (period?: string) =>
    apiRequest<AnalyticsDashboard>(
      `/analytics/enrollments?period=${period || "30"}`
    ),
  getRevenue: (period?: string) =>
    apiRequest<AnalyticsDashboard>(
      `/analytics/revenue?period=${period || "30"}`
    ),
  getCourse: (courseId: string) =>
    apiRequest<AnalyticsDashboard>(`/analytics/course/${courseId}`),
  getFacilitator: () =>
    apiRequest<AnalyticsDashboard>("/analytics/facilitator"),
  getLearner: (learnerId?: string) =>
    apiRequest<AnalyticsDashboard>(
      `/analytics/learner${learnerId ? `/${learnerId}` : ""}`
    ),
  getMonitoring: () => apiRequest<AnalyticsDashboard>("/analytics/monitoring"),
};

// Notifications API
export const notificationsApi = {
  getAll: (unreadOnly?: boolean) =>
    apiRequest<NotificationsResponse>(
      `/notifications?unreadOnly=${unreadOnly || false}`
    ),
  markRead: (id: string) =>
    apiRequest<Notification>(`/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: () =>
    apiRequest<{ message: string }>("/notifications/read-all", {
      method: "PUT",
    }),
  create: (data: CreateNotificationData) =>
    apiRequest<Notification>("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    }), // Admin only
};

// Playback settings response type
export interface PlaybackSettingsResponse {
  screenLockEnabled: boolean;
  offlineModeRequired: boolean;
  maxDefaultPauses: number;
  autoSkipOnMaxPauses: boolean;
  autoSkipDelaySeconds: number;
  earphoneCheckEnabled: boolean;
  flightModeCheckEnabled: boolean;
}

// Settings API
export const settingsApi = {
  getSettings: () => apiRequest<SettingsResponse>("/settings"),
  updateSettings: (data: UpdateSettingsData) =>
    apiRequest<SettingsResponse>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getRazorpayKey: () =>
    apiRequest<RazorpayKeyResponse>("/settings/razorpay-key"),
  getPlaybackSettings: () =>
    apiRequest<PlaybackSettingsResponse>("/settings/playback"),
};

// Auth helpers - use localStorage which works on Android WebView
// ThemeProvider uses localStorage and it persists, so we use the same approach

/**
 * Save auth token to persistent storage
 * Per Capacitor docs: Preferences uses SharedPreferences (Android) / UserDefaults (iOS)
 */
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    const isNative = Capacitor.isNativePlatform();
    console.log("[Auth] Saving token, isNative:", isNative);
    tokenCache = token;

    if (isNative) {
      // Ensure Preferences is configured with the same group
      try {
        await Preferences.configure({ group: PREFERENCES_GROUP });
      } catch (e) {
        // Ignore if configure is not supported
      }

      // Native: Use Capacitor Preferences
      console.log("[Auth] Saving to Capacitor Preferences...");
      await Preferences.set({ key: TOKEN_KEY, value: token });

      // Verify the token was saved
      const verify = await Preferences.get({ key: TOKEN_KEY });
      console.log(
        "[Auth] Token saved to Preferences - verified:",
        verify.value ? "YES" : "NO",
        "Token preview:",
        verify.value ? verify.value.substring(0, 20) + "..." : "none"
      );

      // Also save to localStorage as backup (Android WebView supports it)
      try {
        localStorage.setItem(TOKEN_KEY, token);
        console.log("[Auth] Also saved to localStorage as backup");
      } catch (e) {
        console.log("[Auth] localStorage backup failed (optional):", e);
      }
    } else {
      // Web: Use localStorage
      localStorage.setItem(TOKEN_KEY, token);
      console.log("[Auth] Token saved to localStorage");
    }

    console.log("[Auth] Token save complete. Cache updated:", !!tokenCache);
  } catch (error) {
    console.error("[Auth] Failed to save token:", error);
    throw error;
  }
};

/**
 * Remove auth token from persistent storage
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    const isNative = Capacitor.isNativePlatform();
    console.log("[Auth] Removing token, isNative:", isNative);
    tokenCache = null;

    if (isNative) {
      // Ensure Preferences is configured with the same group
      try {
        await Preferences.configure({ group: PREFERENCES_GROUP });
      } catch (e) {
        // Ignore if configure is not supported
      }

      // Native: Use Capacitor Preferences
      await Preferences.remove({ key: TOKEN_KEY });
      console.log("[Auth] Token removed from Preferences");

      // Also remove from localStorage backup
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (e) {
        // Ignore
      }
    } else {
      // Web: Use localStorage
      localStorage.removeItem(TOKEN_KEY);
      console.log("[Auth] Token removed from localStorage");
    }

    console.log("[Auth] Token removal complete. Cache cleared:", !tokenCache);
  } catch (error) {
    console.error("[Auth] Failed to remove token:", error);
    throw error;
  }
};

/**
 * Check if user has a valid cached token
 */
export const isAuthenticated = () => !!tokenCache;

/**
 * Get the current cached token (sync)
 */
export const getCachedToken = () => tokenCache;
