import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Splash from "./pages/Splash";
import LearnerLogin from "./pages/LearnerLogin";
import LearnerHome from "./pages/LearnerHome";
import CourseDetail from "./pages/CourseDetail";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCourses from "./pages/AdminCourses";
import AdminLessons from "./pages/AdminLessons";
import AdminMonitoring from "./pages/AdminMonitoring";
import AdminPayments from "./pages/AdminPayments";
import AdminSubAdmins from "./pages/AdminSubAdmins";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="therapy-ui-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Index />} />
            
            {/* Learner Routes */}
            <Route path="/splash" element={<Splash />} />
            <Route path="/login" element={<LearnerLogin />} />
            <Route path="/home" element={<LearnerHome />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/lessons" element={<AdminLessons />} />
            <Route path="/admin/monitoring" element={<AdminMonitoring />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/subadmins" element={<AdminSubAdmins />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
