import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LessonCard } from "@/components/learner/LessonCard";
import { PreLessonProtocol } from "@/components/learner/PreLessonProtocol";
import { AudioPlayer } from "@/components/learner/AudioPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  Clock,
  BookOpen,
  DollarSign,
  AlertCircle,
  Users,
  Trash2,
} from "lucide-react";
import { Lesson } from "@/types";
import {
  useCourse,
  useLessonsByCourse,
  useCourseProgress,
  useUpdateLessonProgress,
  useMyAttendance,
} from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AccessCodeInputDialog } from "@/components/learner/AccessCodeInputDialog";
import {
  getDownloadedLessonsForCourse,
  deleteDownloadsForCourse,
  DownloadedLesson,
} from "@/lib/downloadManager";
import { shouldShowPricing } from "@/lib/platformDetection";

type ViewState = "details" | "protocol" | "player";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<ViewState>("details");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isAccessCodeOpen, setIsAccessCodeOpen] = useState(false);
  const [pendingLesson, setPendingLesson] = useState<Lesson | null>(null);

  const { data: courseData, isLoading: courseLoading } = useCourse(id || "");
  const { data: lessonsData, isLoading: lessonsLoading } = useLessonsByCourse(
    id || ""
  );
  const {
    data: progressData,
    refetch: refetchProgress,
    error: progressError,
  } = useCourseProgress(id || "");
  const updateProgress = useUpdateLessonProgress();

  // Track downloaded lessons for this course
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [isDeletingDownloads, setIsDeletingDownloads] = useState(false);

  // Fetch downloaded lessons count
  useEffect(() => {
    const fetchDownloadCount = async () => {
      if (id) {
        try {
          const downloads = await getDownloadedLessonsForCourse(id);
          setDownloadedCount(downloads.length);
        } catch (e) {
          console.warn("Failed to get download count:", e);
        }
      }
    };
    fetchDownloadCount();
  }, [id]);

  // Check attendance for on-site courses
  const isOnsiteCourse = courseData?.type === "onsite";
  const { data: attendanceData } = useMyAttendance(
    isOnsiteCourse ? id || "" : ""
  );

  const course = courseData;
  const lessons: Lesson[] = (lessonsData?.lessons || []).map(
    (l: any, index: number) => {
      const lessonProgress = (progressData as any)?.lessons?.find(
        (p: any) => p.id === l.id
      );
      const prevLessonProgress =
        index > 0
          ? (progressData as any)?.lessons?.find(
            (p: any) => p.id === lessonsData?.lessons[index - 1]?.id
          )
          : null;

      return {
        id: l.id,
        courseId: l.course_id,
        title: l.title,
        description: l.description || "",
        duration: l.duration || "0 min",
        durationSeconds: l.duration_seconds || 0,
        audioUrl: l.audioUrl,
        order: l.order_index || index + 1,
        maxPauses: l.max_pauses ?? 3,
        pausesUsed: lessonProgress?.pausesUsed || 0,
        status: lessonProgress?.completed
          ? "completed"
          : index === 0 || prevLessonProgress?.completed
            ? "active"
            : "locked",
        // Access Code fields
        accessCodeEnabled: l.accessCodeEnabled,
        hasAccessCode: l.hasAccessCode,
        accessCodeType: l.accessCodeType,
        accessCodeExpired: l.accessCodeExpired,
      };
    }
  );

  const isLoading = courseLoading || lessonsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-4 px-4 py-4 max-w-3xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="px-4 py-6 max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.status === "active") {
      // For on-site courses, check attendance before allowing lesson start
      if (isOnsiteCourse) {
        if (!attendanceData?.hasSessionToday) {
          toast({
            title: "No Session Today",
            description:
              "There is no scheduled session for today. Please check the session schedule.",
            variant: "destructive",
          });
          return;
        }
        if (!attendanceData?.isMarkedPresent) {
          toast({
            title: "Attendance Required",
            description:
              "Please ask your facilitator to mark your attendance before starting the lesson.",
            variant: "destructive",
          });
          return;
        }
      }

      // Check for Access Code requirement
      if (lesson.accessCodeEnabled) {
        if (lesson.hasAccessCode) {
          // Has code - open dialog to enter it
          setPendingLesson(lesson);
          setIsAccessCodeOpen(true);
          return;
        } else {
          // No code set by admin yet - block access
          toast({
            title: "Access Code Required",
            description:
              "This lesson requires an access code. Please contact your facilitator.",
            variant: "destructive",
          });
          return;
        }
      }

      setSelectedLesson(lesson);
      setView("protocol");
    }
  };

  const handleAccessCodeVerified = () => {
    if (pendingLesson) {
      setSelectedLesson(pendingLesson);
      setView("protocol");
      setPendingLesson(null);
    }
  };

  const handleStartSession = () => {
    setView("player");
  };

  const handleComplete = async () => {
    if (selectedLesson) {
      try {
        await updateProgress.mutateAsync({
          lessonId: selectedLesson.id,
          data: {
            completed: true,
            timeSpentSeconds: selectedLesson.durationSeconds || 0,
            lastPositionSeconds: selectedLesson.durationSeconds || 0,
          },
        });
        await refetchProgress();
      } catch (error) {
        console.error("Failed to update progress:", error);
      }
    }
    setView("details");
    setSelectedLesson(null);
  };

  const handleDeleteDownloads = async () => {
    if (!id || downloadedCount === 0) return;

    setIsDeletingDownloads(true);
    try {
      const deletedCount = await deleteDownloadsForCourse(id);
      setDownloadedCount(0);
      toast({
        title: "Downloads Deleted",
        description: `${deletedCount} audio file${deletedCount !== 1 ? 's' : ''} deleted successfully.`,
      });
    } catch (error) {
      console.error("Failed to delete downloads:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete some downloads. Please try again.",
        variant: "destructive",
      });
      // Refresh the count
      try {
        const downloads = await getDownloadedLessonsForCourse(id);
        setDownloadedCount(downloads.length);
      } catch (e) {
        // Ignore
      }
    } finally {
      setIsDeletingDownloads(false);
    }
  };

  if (view === "protocol" && selectedLesson) {
    return (
      <PreLessonProtocol
        lesson={selectedLesson}
        onBack={() => setView("details")}
        onStart={handleStartSession}
      />
    );
  }

  if (view === "player" && selectedLesson) {
    return (
      <AudioPlayer
        lesson={selectedLesson}
        onBack={() => setView("protocol")}
        onComplete={handleComplete}
      />
    );
  }

  const progress = (progressData as any)?.progressPercent || 0;
  const completedLessons = (progressData as any)?.completedLessons || 0;
  const totalLessons = lessons.length;
  // User is enrolled if we have progress data AND no 403 error
  const isEnrolled = !!progressData && !progressError;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-4 px-4 py-4 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Course Details
            </p>
            <h1 className="font-serif text-lg font-semibold truncate">
              {course.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-3xl mx-auto">
        {/* On-Site Attendance Alert */}
        {isOnsiteCourse && isEnrolled && (
          <Alert
            variant={
              attendanceData?.isMarkedPresent ? "default" : "destructive"
            }
            className="mb-6 animate-fade-in"
          >
            <Users className="h-4 w-4" />
            <AlertTitle>
              {attendanceData?.isMarkedPresent
                ? "Attendance Confirmed"
                : "Attendance Required"}
            </AlertTitle>
            <AlertDescription>
              {attendanceData?.hasSessionToday
                ? attendanceData?.isMarkedPresent
                  ? "Your attendance has been marked for today's session. You may start lessons."
                  : "Please ask your facilitator to mark your attendance before starting lessons."
                : "No session is scheduled for today. Check the schedule for upcoming sessions."}
            </AlertDescription>
          </Alert>
        )}

        {/* Course Info */}
        <section className="mb-8 animate-fade-in">
          <div className="flex gap-2 mb-4">
            <Badge variant={course.type === "self" ? "self" : "onsite"}>
              {course.type === "self" ? "Self-Paced" : "On-Site"}
            </Badge>
            <Badge
              variant={
                isEnrolled
                  ? "active"
                  : course.status === "active"
                    ? "active"
                    : "locked"
              }
            >
              {isEnrolled
                ? "Enrolled"
                : course.status?.charAt(0).toUpperCase() +
                course.status?.slice(1)}
            </Badge>
          </div>

          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
            {course.title}
          </h2>
          <p className="text-muted-foreground mb-6">{course.description}</p>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>{totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{course.duration || "N/A"}</span>
            </div>
            {shouldShowPricing() && course.price > 0 && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                <span>₹{course.price}</span>
              </div>
            )}
          </div>
        </section>

        {/* Progress */}
        {isEnrolled && (
          <section className="mb-8 bg-card rounded-xl border border-border/50 p-5 shadow-soft animate-fade-in animate-delay-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">Your Progress</h3>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {completedLessons} of {totalLessons} lessons completed
            </p>
          </section>
        )}

        {/* Delete Downloads Option */}
        {isEnrolled && (
          <section className="mb-8 animate-fade-in animate-delay-150">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteDownloads}
              disabled={downloadedCount === 0 || isDeletingDownloads}
              className="w-full flex items-center justify-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="h-4 w-4" />
              {isDeletingDownloads
                ? "Deleting..."
                : downloadedCount > 0
                  ? `Delete Downloaded Audio (${downloadedCount})`
                  : "No Downloaded Audio"
              }
            </Button>
          </section>
        )}

        {/* Lessons */}
        <section className="animate-fade-in animate-delay-200">
          <h3 className="font-serif text-xl font-semibold text-foreground mb-4">
            Lessons
          </h3>
          <div className="space-y-3">
            {lessons.length > 0 ? (
              lessons.map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  courseId={id}
                  onClick={() => handleLessonClick(lesson)}
                  className="opacity-0 animate-fade-in"
                  style={
                    {
                      animationDelay: `${(index + 3) * 100}ms`,
                    } as React.CSSProperties
                  }
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No lessons available
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Access Code Input Dialog */}
      {pendingLesson && (
        <AccessCodeInputDialog
          lessonId={pendingLesson.id}
          lessonTitle={pendingLesson.title}
          open={isAccessCodeOpen}
          onOpenChange={setIsAccessCodeOpen}
          onVerified={handleAccessCodeVerified}
        />
      )}
    </div>
  );
}
