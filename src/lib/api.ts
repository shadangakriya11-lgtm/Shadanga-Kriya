const API_BASE_URL = 'http://localhost:4000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('auth_token');

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiRequest<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => apiRequest<any>('/auth/profile'),

  updateProfile: (data: any) =>
    apiRequest<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Users API (Admin)
export const usersApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<{ users: any[]; pagination: any }>(`/users${query}`);
  },
  getById: (id: string) => apiRequest<any>(`/users/${id}`),
  create: (data: any) => apiRequest<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<any>(`/users/${id}`, { method: 'DELETE' }),
  getStats: () => apiRequest<any>('/users/stats'),
};

// Courses API
export const coursesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<{ courses: any[]; pagination: any }>(`/courses${query}`);
  },
  getById: (id: string) => apiRequest<any>(`/courses/${id}`),
  create: (data: any) => apiRequest<any>('/courses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<any>(`/courses/${id}`, { method: 'DELETE' }),
  getStats: () => apiRequest<any>('/courses/stats'),
};

// Lessons API
export const lessonsApi = {
  getByCourse: (courseId: string) => apiRequest<{ lessons: any[] }>(`/lessons/course/${courseId}`),
  getById: (id: string) => apiRequest<any>(`/lessons/${id}`),
  create: (data: any) => apiRequest<any>('/lessons', { method: 'POST', body: data }),
  update: (id: string, data: any) => apiRequest<any>(`/lessons/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiRequest<any>(`/lessons/${id}`, { method: 'DELETE' }),
};

// Enrollments API
export const enrollmentsApi = {
  getMy: () => apiRequest<{ enrollments: any[] }>('/enrollments/my'),
  enroll: (courseId: string) => apiRequest<any>('/enrollments', { method: 'POST', body: JSON.stringify({ courseId }) }),
  unenroll: (courseId: string) => apiRequest<any>(`/enrollments/${courseId}`, { method: 'DELETE' }),
  getAll: () => apiRequest<{ enrollments: any[]; pagination: any }>('/enrollments'),
  getStats: () => apiRequest<any>('/enrollments/stats'),
};

// Progress API
export const progressApi = {
  getMy: () => apiRequest<any>('/progress/my'),
  getCourse: (courseId: string) => apiRequest<any>(`/progress/course/${courseId}`),
  updateLesson: (lessonId: string, data: any) => apiRequest<any>(`/progress/lesson/${lessonId}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Payments API
export const paymentsApi = {
  getMy: () => apiRequest<{ payments: any[] }>('/payments/my'),
  create: (courseId: string, paymentMethod?: string) => apiRequest<any>('/payments', { method: 'POST', body: JSON.stringify({ courseId, paymentMethod }) }),
  complete: (paymentId: string) => apiRequest<any>(`/payments/${paymentId}/complete`, { method: 'POST', body: JSON.stringify({ status: 'completed' }) }),
  getAll: () => apiRequest<{ payments: any[]; pagination: any }>('/payments'),
  getStats: () => apiRequest<any>('/payments/stats'),
  activate: (data: { userId: string; courseId: string; notes?: string }) =>
    apiRequest<any>('/payments/activate', { method: 'POST', body: JSON.stringify(data) }),
  createRazorpayOrder: (courseId: string) =>
    apiRequest<any>('/payments/create-razorpay-order', { method: 'POST', body: JSON.stringify({ courseId }) }),
  verifyRazorpay: (data: any) =>
    apiRequest<any>('/payments/verify-razorpay', { method: 'POST', body: JSON.stringify(data) }),
};

// Sessions API
export const sessionsApi = {
  getAll: () => apiRequest<{ sessions: any[] }>('/sessions'),
  getMy: () => apiRequest<{ sessions: any[] }>('/sessions/my'),
  getById: (id: string) => apiRequest<any>(`/sessions/${id}`),
  create: (data: any) => apiRequest<any>('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  start: (id: string) => apiRequest<any>(`/sessions/${id}/start`, { method: 'POST' }),
  end: (id: string) => apiRequest<any>(`/sessions/${id}/end`, { method: 'POST' }),
};

// Attendance API
export const attendanceApi = {
  getSession: (sessionId: string) => apiRequest<{ attendance: any[]; stats: any }>(`/attendance/session/${sessionId}`),
  mark: (sessionId: string, userId: string, status: 'present' | 'absent') =>
    apiRequest<any>(`/attendance/session/${sessionId}/user/${userId}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  bulkMark: (sessionId: string, attendances: any[]) =>
    apiRequest<any>(`/attendance/session/${sessionId}/bulk`, { method: 'PUT', body: JSON.stringify({ attendances }) }),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => apiRequest<any>('/analytics/dashboard'),
  getEnrollmentTrends: (period?: string) => apiRequest<any>(`/analytics/enrollments?period=${period || '30'}`),
  getRevenue: (period?: string) => apiRequest<any>(`/analytics/revenue?period=${period || '30'}`),
  getCourse: (courseId: string) => apiRequest<any>(`/analytics/course/${courseId}`),
  getFacilitator: () => apiRequest<any>('/analytics/facilitator'),
  getLearner: (learnerId?: string) => apiRequest<any>(`/analytics/learner${learnerId ? `/${learnerId}` : ''}`),
  getMonitoring: () => apiRequest<any>('/analytics/monitoring'),
};

// Notifications API
export const notificationsApi = {
  getAll: (unreadOnly?: boolean) => apiRequest<{ notifications: any[]; unreadCount: number }>(`/notifications?unreadOnly=${unreadOnly || false}`),
  markRead: (id: string) => apiRequest<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiRequest<any>('/notifications/read-all', { method: 'PUT' }),
  create: (data: any) => apiRequest<any>('/notifications', { method: 'POST', body: JSON.stringify(data) }), // Admin only
};

// Settings API
export const settingsApi = {
  getSettings: () => apiRequest<{ settings: any }>('/settings'),
  updateSettings: (data: any) => apiRequest<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getRazorpayKey: () => apiRequest<{ keyId: string }>('/settings/razorpay-key'),
};

// Auth helpers
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('auth_token');
export const isAuthenticated = () => !!getToken();
