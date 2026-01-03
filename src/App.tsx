import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Splash from "./pages/Splash";
import LearnerLogin from "./pages/LearnerLogin";
import LearnerHome from "./pages/LearnerHome";
import LearnerNotifications from "./pages/LearnerNotifications";
import CourseDetail from "./pages/CourseDetail";
import LearnerDashboard from "./pages/LearnerDashboard";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import PrivacySecurity from "./pages/PrivacySecurity";
import HelpSupport from "./pages/HelpSupport";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCourses from "./pages/AdminCourses";
import AdminLessons from "./pages/AdminLessons";
import AdminMonitoring from "./pages/AdminMonitoring";
import AdminPayments from "./pages/AdminPayments";
import AdminSubAdmins from "./pages/AdminSubAdmins";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminNotifications from "./pages/AdminNotifications";
import AdminSettings from "./pages/AdminSettings";
import FacilitatorDashboard from "./pages/FacilitatorDashboard";
import FacilitatorAttendance from "./pages/FacilitatorAttendance";
import FacilitatorSessions from "./pages/FacilitatorSessions";
import FacilitatorReports from "./pages/FacilitatorReports";
import FacilitatorNotifications from "./pages/FacilitatorNotifications";
import NotFound from "./pages/NotFound";

import { StatusBar, Style } from '@capacitor/status-bar';


StatusBar.setStyle({ style: Style.Dark });


const queryClient = new QueryClient();

const NotificationPage = () => {
  const { user } = useAuth();
  return user?.role === 'facilitator' ? <FacilitatorNotifications /> : <LearnerNotifications />;
};

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="therapy-ui-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Landing */}
              <Route path="/" element={<Index />} />

              {/* Auth */}
              <Route path="/auth" element={<Auth />} />

              {/* Learner Routes */}
              <Route path="/splash" element={<Splash />} />
              <Route path="/login" element={<LearnerLogin />} />
              <Route path="/home" element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <LearnerHome />
                </ProtectedRoute>
              } />
              <Route path="/course/:id" element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <CourseDetail />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <LearnerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/progress" element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <Progress />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <LearnerNotifications />
                </ProtectedRoute>
              } />
              <Route path="/privacy" element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <PrivacySecurity />
                </ProtectedRoute>
              } />
              <Route path="/help" element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <HelpSupport />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCourses />
                </ProtectedRoute>
              } />
              <Route path="/admin/lessons" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLessons />
                </ProtectedRoute>
              } />
              <Route path="/admin/monitoring" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMonitoring />
                </ProtectedRoute>
              } />
              <Route path="/admin/payments" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPayments />
                </ProtectedRoute>
              } />
              <Route path="/admin/subadmins" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSubAdmins />
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/admin/notifications" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminNotifications />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              } />

              {/* Facilitator Routes */}
              <Route path="/facilitator" element={
                <ProtectedRoute allowedRoles={['facilitator']}>
                  <FacilitatorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/facilitator/attendance" element={
                <ProtectedRoute allowedRoles={['facilitator']}>
                  <FacilitatorAttendance />
                </ProtectedRoute>
              } />
              <Route path="/facilitator/sessions" element={
                <ProtectedRoute allowedRoles={['facilitator']}>
                  <FacilitatorSessions />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={['learner', 'facilitator']}>
                  <NotificationPage />
                </ProtectedRoute>
              } />
              <Route path="/facilitator/reports" element={
                <ProtectedRoute allowedRoles={['facilitator']}>
                  <FacilitatorReports />
                </ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
