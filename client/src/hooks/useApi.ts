import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  coursesApi,
  lessonsApi,
  enrollmentsApi,
  progressApi,
  paymentsApi,
  sessionsApi,
  attendanceApi,
  analyticsApi,
  usersApi,
  notificationsApi,
  settingsApi,
  PlaybackSettingsResponse,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

// Courses hooks
export function useCourses(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => coursesApi.getAll(params),
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: () => coursesApi.getById(id),
    enabled: !!id,
  });
}

export function useCourseStats() {
  return useQuery({
    queryKey: ["courseStats"],
    queryFn: () => coursesApi.getStats(),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create course",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      coursesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update course",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete course",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Lessons hooks
export function useLessonsByCourse(courseId: string) {
  return useQuery({
    queryKey: ["lessons", courseId],
    queryFn: () => lessonsApi.getByCourse(courseId),
    enabled: !!courseId,
  });
}

export function useLesson(id: string) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: () => lessonsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lessonsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast({ title: "Lesson created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      lessonsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast({ title: "Lesson updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lessonsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast({ title: "Lesson deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Access Code hooks
export function useAccessCodeInfo(lessonId: string) {
  return useQuery({
    queryKey: ["accessCode", lessonId],
    queryFn: () => lessonsApi.getAccessCodeInfo(lessonId),
    enabled: !!lessonId,
  });
}

export function useGenerateAccessCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      codeType,
      expiresInMinutes,
    }: {
      lessonId: string;
      codeType: "permanent" | "temporary";
      expiresInMinutes?: number;
    }) => lessonsApi.generateAccessCode(lessonId, codeType, expiresInMinutes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["accessCode", variables.lessonId],
      });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      // Use predicate to match allLessons queries with any course IDs
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "allLessons",
      });
      toast({ title: "Access code generated successfully!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate access code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useToggleAccessCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      enabled,
    }: {
      lessonId: string;
      enabled: boolean;
    }) => lessonsApi.toggleAccessCode(lessonId, enabled),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["accessCode", variables.lessonId],
      });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      // Use predicate to match allLessons queries with any course IDs
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "allLessons",
      });
      toast({
        title: `Access code ${variables.enabled ? "enabled" : "disabled"}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to toggle access code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useClearAccessCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => lessonsApi.clearAccessCode(lessonId),
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["accessCode", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      // Use predicate to match allLessons queries with any course IDs
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "allLessons",
      });
      toast({ title: "Access code cleared" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clear access code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useVerifyAccessCode() {
  return useMutation({
    mutationFn: ({ lessonId, code }: { lessonId: string; code: string }) =>
      lessonsApi.verifyAccessCode(lessonId, code),
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Enrollments hooks
export function useMyEnrollments() {
  return useQuery({
    queryKey: ["myEnrollments"],
    queryFn: () => enrollmentsApi.getMy(),
  });
}

export function useAllEnrollments() {
  return useQuery({
    queryKey: ["allEnrollments"],
    queryFn: () => enrollmentsApi.getAll(),
  });
}

export function useEnrollmentStats() {
  return useQuery({
    queryKey: ["enrollmentStats"],
    queryFn: () => enrollmentsApi.getStats(),
  });
}

export function useEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enrollmentsApi.enroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Enrolled successfully!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to enroll",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUnenroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enrollmentsApi.unenroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
      toast({ title: "Unenrolled successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unenroll",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Admin enrollment hooks
export function useEnrollmentsByCourse(courseId: string) {
  return useQuery({
    queryKey: ["courseEnrollments", courseId],
    queryFn: () => enrollmentsApi.getByCourse(courseId),
    enabled: !!courseId,
  });
}

export function useAdminEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: string; courseId: string }) =>
      enrollmentsApi.adminEnroll(userId, courseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["courseEnrollments", variables.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "User enrolled successfully!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to enroll user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAdminUnenroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: string; courseId: string }) =>
      enrollmentsApi.adminUnenroll(userId, courseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["courseEnrollments", variables.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "User unenrolled successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unenroll user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Progress hooks
export function useMyProgress() {
  return useQuery({
    queryKey: ["myProgress"],
    queryFn: () => progressApi.getMy(),
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ["courseProgress", courseId],
    queryFn: () => progressApi.getCourse(courseId),
    enabled: !!courseId,
  });
}

export function useUpdateLessonProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: any }) =>
      progressApi.updateLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProgress"] });
      queryClient.invalidateQueries({ queryKey: ["courseProgress"] });
    },
  });
}

// Payments hooks
export function useMyPayments() {
  return useQuery({
    queryKey: ["myPayments"],
    queryFn: () => paymentsApi.getMy(),
  });
}

export function useAllPayments() {
  return useQuery({
    queryKey: ["allPayments"],
    queryFn: () => paymentsApi.getAll(),
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: ["paymentStats"],
    queryFn: () => paymentsApi.getStats(),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      paymentMethod,
    }: {
      courseId: string;
      paymentMethod?: string;
    }) => paymentsApi.create(courseId, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPayments"] });
      queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
      toast({ title: "Payment initiated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCompletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPayments"] });
      queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
      toast({ title: "Payment completed!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useActivateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPayments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
      queryClient.invalidateQueries({ queryKey: ["allEnrollments"] });
      toast({ title: "Course activated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Activation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Sessions hooks
export function useAllSessions() {
  return useQuery({
    queryKey: ["allSessions"],
    queryFn: () => sessionsApi.getAll(),
    refetchInterval: 10000, // Real-time sessions for admin/facilitator
  });
}

export function useMySessions() {
  return useQuery({
    queryKey: ["mySessions"],
    queryFn: () => sessionsApi.getMy(),
    refetchInterval: 10000, // Real-time sessions for facilitator
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => sessionsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allSessions"] });
      queryClient.invalidateQueries({ queryKey: ["mySessions"] });
      toast({ title: "Session created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create session",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      sessionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allSessions"] });
      queryClient.invalidateQueries({ queryKey: ["mySessions"] });
      toast({ title: "Session updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update session",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allSessions"] });
      queryClient.invalidateQueries({ queryKey: ["mySessions"] });
      toast({ title: "Session started!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start session",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.end,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allSessions"] });
      queryClient.invalidateQueries({ queryKey: ["mySessions"] });
      toast({ title: "Session ended" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to end session",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Attendance hooks
export function useSessionAttendance(sessionId: string) {
  return useQuery({
    queryKey: ["attendance", sessionId],
    queryFn: () => attendanceApi.getSession(sessionId),
    enabled: !!sessionId,
    refetchInterval: 5000, // Frequent updates during active attendance marking
  });
}

export function useMyAttendance(courseId: string) {
  return useQuery({
    queryKey: ["myAttendance", courseId],
    queryFn: () => attendanceApi.getMy(courseId),
    enabled: !!courseId,
    staleTime: 30000, // Check every 30 seconds
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      userId,
      status,
    }: {
      sessionId: string;
      userId: string;
      status: "present" | "absent";
    }) => attendanceApi.mark(sessionId, userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Attendance marked" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark attendance",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBulkMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      attendances,
    }: {
      sessionId: string;
      attendances: any[];
    }) => attendanceApi.bulkMark(sessionId, attendances),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Attendance saved" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save attendance",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Analytics hooks
export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ["dashboardAnalytics"],
    queryFn: () => analyticsApi.getDashboard(),
  });
}

export function useEnrollmentTrends(period?: string) {
  return useQuery({
    queryKey: ["enrollmentTrends", period],
    queryFn: () => analyticsApi.getEnrollmentTrends(period),
  });
}

export function useRevenueAnalytics(period?: string) {
  return useQuery({
    queryKey: ["revenueAnalytics", period],
    queryFn: () => analyticsApi.getRevenue(period),
  });
}

export function useCourseAnalytics(courseId: string) {
  return useQuery({
    queryKey: ["courseAnalytics", courseId],
    queryFn: () => analyticsApi.getCourse(courseId),
    enabled: !!courseId,
  });
}

export function useFacilitatorAnalytics() {
  return useQuery({
    queryKey: ["facilitatorAnalytics"],
    queryFn: () => analyticsApi.getFacilitator(),
    refetchInterval: 10000, // Real-time stats for facilitator dashboard
  });
}

export function useLearnerAnalytics(learnerId?: string) {
  return useQuery({
    queryKey: ["learnerAnalytics", learnerId],
    queryFn: () => analyticsApi.getLearner(learnerId),
    refetchInterval: 10000, // Poll every 10 seconds for real-time dashboard updates
  });
}

// Notifications hooks
export function useNotifications(unreadOnly?: boolean) {
  return useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => notificationsApi.getAll(unreadOnly),
    refetchInterval: 30000, // Poll every 30 seconds (reduced from 10s to avoid rate limiting)
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMonitoringStats() {
  return useQuery({
    queryKey: ["monitoringStats"],
    queryFn: () => analyticsApi.getMonitoring(),
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });
}

// Users hooks (Admin)
export function useUsers(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersApi.getAll(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ["userStats"],
    queryFn: () => usersApi.getStats(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Playback Settings hook
export function usePlaybackSettings() {
  return useQuery<PlaybackSettingsResponse>({
    queryKey: ["playbackSettings"],
    queryFn: () => settingsApi.getPlaybackSettings(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
