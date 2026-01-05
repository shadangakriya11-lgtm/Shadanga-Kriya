import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useEffect, useRef } from "react";
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

import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { App as CapApp, BackButtonListenerEvent } from "@capacitor/app";

// Configure status bar for native platforms
if (Capacitor.isNativePlatform()) {
  // overlay: true means content renders under status bar, we handle spacing with CSS safe-area-inset
  StatusBar.setOverlaysWebView({ overlay: true });
  StatusBar.setStyle({ style: Style.Light }); // Light icons for dark status bar background
  StatusBar.setBackgroundColor({ color: "#00000000" }); // Transparent - header will show through
}

const queryClient = new QueryClient();

const NotificationPage = () => {
  const { user } = useAuth();
  return user?.role === "facilitator" ? (
    <FacilitatorNotifications />
  ) : (
    <LearnerNotifications />
  );
};

/**
 * Back button handler - per official Capacitor @capacitor/app docs (Context7):
 * "Listen for the hardware back button event (Android only).
 * Listening for this event will disable the default back button behaviour,
 * so you might want to call window.history.back() manually.
 * If you want to close the app, call App.exitApp()."
 *
 * BackButtonListenerEvent.canGoBack indicates whether browser history can go back
 */
const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPathRef = useRef(location.pathname);

  // Keep ref updated
  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Per Context7 docs: exact pattern from @capacitor/app
    const backButtonHandler = CapApp.addListener(
      "backButton",
      ({ canGoBack }: BackButtonListenerEvent) => {
        const currentPath = currentPathRef.current;

        // Root pages where back should minimize/exit
        const rootPages = [
          "/",
          "/home",
          "/admin",
          "/facilitator",
          "/auth",
          "/splash",
        ];
        const isRootPage = rootPages.includes(currentPath);

        console.log("[BackButton] path:", currentPath, "canGoBack:", canGoBack);

        if (isRootPage) {
          // Per docs: use minimizeApp() or exitApp() on root
          CapApp.minimizeApp();
        } else if (canGoBack) {
          // Per docs: "call window.history.back() manually"
          window.history.back();
        } else {
          // Fallback navigation
          if (currentPath.startsWith("/admin")) {
            navigate("/admin", { replace: true });
          } else if (currentPath.startsWith("/facilitator")) {
            navigate("/facilitator", { replace: true });
          } else {
            navigate("/home", { replace: true });
          }
        }
      }
    );

    return () => {
      // Per docs: handler has remove() function
      backButtonHandler.then((h) => h.remove());
    };
  }, [navigate]);

  return null;
};

const AppContent = () => (
  <ThemeProvider defaultTheme="light" storageKey="therapy-ui-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <BackButtonHandler />
            <Routes>
              {/* Landing */}
              <Route path="/" element={<Index />} />

              {/* Auth */}
              <Route path="/auth" element={<Auth />} />

              {/* Learner Routes */}
              <Route path="/splash" element={<Splash />} />
              <Route
                path="/home"
                element={
                  <ProtectedRoute allowedRoles={["learner"]}>
                    <LearnerHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/course/:id"
                element={
                  <ProtectedRoute allowedRoles={["learner"]}>
                    <CourseDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["learner"]}>
                    <LearnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute allowedRoles={["learner"]}>
                    <Progress />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute allowedRoles={["learner"]}>
                    <LearnerNotifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/privacy"
                element={
                  <ProtectedRoute allowedRoles={["learner"]}>
                    <PrivacySecurity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute allowedRoles={["learner"]}>
                    <HelpSupport />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/lessons"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminLessons />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/monitoring"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payments"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/subadmins"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminSubAdmins />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminNotifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />

              {/* Facilitator Routes */}
              <Route
                path="/facilitator"
                element={
                  <ProtectedRoute allowedRoles={["facilitator"]}>
                    <FacilitatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facilitator/attendance"
                element={
                  <ProtectedRoute allowedRoles={["facilitator"]}>
                    <FacilitatorAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facilitator/sessions"
                element={
                  <ProtectedRoute allowedRoles={["facilitator"]}>
                    <FacilitatorSessions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute allowedRoles={["learner", "facilitator"]}>
                    <NotificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facilitator/reports"
                element={
                  <ProtectedRoute allowedRoles={["facilitator"]}>
                    <FacilitatorReports />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

const App = () => <AppContent />;

export default App;
