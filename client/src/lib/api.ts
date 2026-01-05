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
      const allKeys = await Preferences.keys();
      console.log("[Auth] All Preferences keys:", allKeys.keys);
    } else {
      // Web: Use localStorage as fallback
      console.log("[Auth] Using localStorage for web platform");
      tokenCache = localStorage.getItem(TOKEN_KEY);
      console.log(
        "[Auth] Token from localStorage:",
        tokenCache ? "found" : "not found"
      );
    }

    isInitialized = true;
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
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
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
    apiRequest<{ orderId: string; amount: number }>(
      "/payments/create-razorpay-order",
      { method: "POST", body: JSON.stringify({ courseId }) }
    ),
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
      // Native: Use Capacitor Preferences
      console.log("[Auth] Saving to Capacitor Preferences...");
      await Preferences.set({ key: TOKEN_KEY, value: token });

      // Verify the token was saved
      const verify = await Preferences.get({ key: TOKEN_KEY });
      console.log(
        "[Auth] Token saved to Preferences - verified:",
        verify.value ? "YES" : "NO"
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
