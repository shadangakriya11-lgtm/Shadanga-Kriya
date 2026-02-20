import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LearnerHeader } from "@/components/learner/LearnerHeader";
import { BottomNav } from "@/components/learner/BottomNav";
import { CourseCard } from "@/components/learner/CourseCard";
import { PaymentModal } from "@/components/learner/PaymentModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { BookOpen, Clock, CheckCircle2, Search, X, Headphones, Sparkles, ChevronRight } from "lucide-react";
import { Course } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses, useMyEnrollments, useDemoStatus, useSkipDemo } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { shouldShowPaymentFeatures, getLockedCourseMessage } from "@/lib/platformDetection";
import { useToast } from "@/hooks/use-toast";

export default function LearnerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const { data: enrollmentsData, isLoading: enrollmentsLoading } =
    useMyEnrollments();
  const { data: demoStatus } = useDemoStatus();
  const skipDemoMutation = useSkipDemo();

  const courses = coursesData?.courses || [];
  const enrollments = enrollmentsData?.enrollments || [];

  // Map courses with enrollment status
  const mappedCourses: Course[] = courses.map((course: any) => {
    const enrollment = enrollments.find((e: any) => e.courseId === course.id);
    const totalLessons = enrollment?.totalLessons || course.lessonCount || 0;
    const completedLessons = enrollment?.completedLessons || 0;
    // Calculate progress from actual lesson counts for accuracy
    const calculatedProgress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      type: course.type || "self",
      status: enrollment
        ? enrollment.status === "completed"
          ? "completed"
          : "active"
        : course.price > 0
          ? "locked"
          : "pending",
      progress: calculatedProgress,
      totalLessons: totalLessons,
      completedLessons: completedLessons,
      duration: course.durationHours
        ? `${course.durationHours} hours`
        : "0 min",
      price: course.price,
    };
  });

  // iOS App Store compliance: Show enrolled courses + free courses (price = 0) on iOS
  // Hide only paid locked courses (price > 0 and not enrolled)
  const displayCourses = shouldShowPaymentFeatures() 
    ? mappedCourses 
    : mappedCourses.filter((c) => 
        c.status === "active" || 
        c.status === "completed" || 
        (c.status === "pending" && c.price === 0) || // Free courses
        (c.status === "locked" && c.price === 0)     // Free but locked by prerequisites
      );

  const activeCourses = displayCourses.filter(
    (c) => c.status === "active" || c.status === "pending"
  );
  const completedCourses = displayCourses.filter(
    (c) => c.status === "completed"
  );
  const lockedCourses = displayCourses.filter((c) => c.status === "locked");

  // Filter courses by search query
  const searchFilteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return displayCourses;
    const query = searchQuery.toLowerCase();
    return displayCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
    );
  }, [displayCourses, searchQuery]);

  const filteredCourses = useMemo(() => {
    const baseList = searchQuery.trim() ? searchFilteredCourses : displayCourses;

    if (activeTab === "all") return baseList;
    if (activeTab === "active")
      return baseList.filter(
        (c) => c.status === "active" || c.status === "pending"
      );
    return baseList.filter((c) => c.status === "completed");
  }, [activeTab, searchFilteredCourses, mappedCourses, searchQuery]);

  const handleCourseClick = (course: Course) => {
    // On iOS, locked courses are not displayed, so this should only handle enrolled courses
    if (course.status === "locked" && course.price) {
      // iOS App Store compliance: Don't show payment on iOS
      if (!shouldShowPaymentFeatures()) {
        // This shouldn't happen on iOS since locked courses are filtered out
        toast({
          title: "Course Not Available",
          description: "This course is not available in your account.",
          variant: "default",
        });
        return;
      }
      setSelectedCourse(course);
      setIsPaymentOpen(true);
    } else {
      navigate(`/course/${course.id}`);
    }
  };

  const handlePaymentSuccess = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const handleListenDemo = () => {
    navigate("/demo");
  };

  const handleSkipDemo = async () => {
    await skipDemoMutation.mutateAsync();
  };

  const isLoading = coursesLoading || enrollmentsLoading;
  const showDemoBanner = demoStatus?.showDemo;

  return (
    <div className="min-h-screen bg-background pb-20">
      <LearnerHeader
        userName={user ? `${user.firstName} ${user.lastName}` : "User"}
      />

      <main className="px-4 py-6 max-w-3xl mx-auto">
        {/* Demo Banner */}
        {showDemoBanner && (
          <section className="mb-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-xl">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl transform -translate-x-10 translate-y-10" />
              </div>

              <div className="relative p-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Headphones className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-yellow-300" />
                      <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                        विशेष Demo
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white mb-2">
                      Demo Meditation सुनें
                    </h3>
                    <p className="text-sm text-white/80 mb-4">
                      अपनी ध्यान यात्रा शुरू करने से पहले एक विशेष Demo Meditation का अनुभव करें।
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleListenDemo}
                        className="bg-white text-primary hover:bg-white/90 font-medium shadow-lg"
                      >
                        🎧 Demo सुनें
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleSkipDemo}
                        className="text-white/80 hover:text-white hover:bg-white/10"
                        disabled={skipDemoMutation.isPending}
                      >
                        {skipDemoMutation.isPending ? "..." : "बाद में"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Welcome Section */}
        <section className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Your Therapy Journey
          </h1>
          <p className="text-muted-foreground">
            Continue your path to wellness with structured, protocol-driven
            sessions.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
            <BookOpen className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "-" : activeCourses.length}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          {shouldShowPaymentFeatures() && (
            <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
              <Clock className="h-5 w-5 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : lockedCourses.length}
              </p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          )}
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
            <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "-" : completedCourses.length}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </section>

        {/* Search Bar */}
        <section className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 pr-10 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              {filteredCourses.length} course
              {filteredCourses.length !== 1 ? "s" : ""} found
            </p>
          )}
        </section>

        {/* Courses Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="all" className="flex-1">
              All Courses
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => handleCourseClick(course)}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No courses found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />

      {/* Payment Modal - Only show on web/Android */}
      {shouldShowPaymentFeatures() && (
        <PaymentModal
          course={selectedCourse}
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
