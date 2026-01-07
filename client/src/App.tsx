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
import React, { useEffect, useRef } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
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
import FacilitatorMonitoring from "./pages/FacilitatorMonitoring";
import FacilitatorCourses from "./pages/FacilitatorCourses";
import DownloadsPage from "./pages/learner/DownloadsPage";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import VisionMission from "./pages/VisionMission";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";

import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { App as CapApp, BackButtonListenerEvent } from "@capacitor/app";

// Configure status bar for native platforms
if (Capacitor.isNativePlatform()) {
  // Don't overlay webview - this prevents content from going behind status bar
  StatusBar.setOverlaysWebView({ overlay: false });
  StatusBar.setStyle({ style: Style.Light });
  StatusBar.setBackgroundColor({ color: "#0d4744" }); // Teal background
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
 * Back button handler component - per Capacitor App API documentation:
 * "Listening for this event will disable the default back button behaviour,
 * so you might want to call window.history.back() manually.
 * If you want to close the app, call App.exitApp()."
 *
 * The canGoBack property in BackButtonListenerEvent indicates whether
 * the browser can go back in history.
 */
// Toast component for exit warning
const ExitToast = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "12px 24px",
        borderRadius: "8px",
        fontSize: "14px",
        zIndex: 9999,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      Press back again to exit
    </div>
  );
};

const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Use ref to always have current pathname in the listener
  const currentPathRef = useRef(location.pathname);
  // Track last back press time for double-tap to exit
  const lastBackPressRef = useRef<number>(0);
  // State for showing exit toast
  const [showExitToast, setShowExitToast] = React.useState(false);

  // Keep ref updated with current path
  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handler: { remove: () => Promise<void> } | null = null;
    let toastTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleDoubleBackExit = () => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastBackPressRef.current;
      const EXIT_TIMEOUT = 2000; // 2 seconds window for double-tap

      if (timeDiff < EXIT_TIMEOUT) {
        // Second back press within timeout - exit app
        console.log("[BackButton] Double back detected - exiting app");
        CapApp.exitApp();
      } else {
        // First back press - show toast and wait for second
        console.log("[BackButton] First back press - showing exit toast");
        lastBackPressRef.current = currentTime;
        setShowExitToast(true);

        // Hide toast after timeout
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
          setShowExitToast(false);
        }, EXIT_TIMEOUT);
      }
    };

    const setupListener = async () => {
      handler = await CapApp.addListener(
        "backButton",
        ({ canGoBack }: BackButtonListenerEvent) => {
          const currentPath = currentPathRef.current;

          // Define home/root pages where back should trigger double-tap exit
          const rootPages = [
            "/",
            "/home",
            "/admin",
            "/facilitator",
            "/auth",
            "/splash",
          ];
          const isRootPage = rootPages.includes(currentPath);

          console.log(
            "[BackButton] Path:",
            currentPath,
            "canGoBack:",
            canGoBack,
            "historyLength:",
            window.history.length
          );

          if (isRootPage) {
            // On root page - use double-back to exit (standard Android behavior)
            handleDoubleBackExit();
          } else if (canGoBack) {
            // Use browser history if canGoBack is true (per Capacitor docs)
            console.log("[BackButton] Going back in history");
            window.history.back();
          } else {
            // Fallback: navigate to appropriate home based on path
            console.log("[BackButton] Navigating to home fallback");
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
    };

    setupListener();

    return () => {
      // Cleanup: remove listener and clear timeout when component unmounts
      if (handler) {
        handler.remove();
      }
      if (toastTimeout) {
        clearTimeout(toastTimeout);
      }
    };
  }, [navigate]); // Only depend on navigate, use ref for pathname

  return <ExitToast visible={showExitToast} />;
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

              {/* Public Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/vision-mission" element={<VisionMission />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />

              {/* Auth */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

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
                path="/downloads"
                element={
                  <ProtectedRoute allowedRoles={["learner"]}>
                    <DownloadsPage />
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
                  <ProtectedRoute allowedRoles={["admin", "sub_admin"]}>
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
                  <ProtectedRoute allowedRoles={["facilitator", "sub_admin"]}>
                    <FacilitatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facilitator/courses"
                element={
                  <ProtectedRoute allowedRoles={["facilitator", "sub_admin"]}>
                    <FacilitatorCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facilitator/attendance"
                element={
                  <ProtectedRoute allowedRoles={["facilitator", "sub_admin"]}>
                    <FacilitatorAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facilitator/sessions"
                element={
                  <ProtectedRoute allowedRoles={["facilitator", "sub_admin"]}>
                    <FacilitatorSessions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute
                    allowedRoles={["learner", "facilitator", "sub_admin"]}
                  >
                    <NotificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facilitator/reports"
                element={
                  <ProtectedRoute allowedRoles={["facilitator", "sub_admin"]}>
                    <FacilitatorReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facilitator/monitoring"
                element={
                  <ProtectedRoute allowedRoles={["facilitator", "sub_admin"]}>
                    <FacilitatorMonitoring />
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
