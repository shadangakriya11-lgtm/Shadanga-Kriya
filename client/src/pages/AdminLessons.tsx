import { useState, useMemo } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Search,
  Upload,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourses, useDeleteLesson, useReorderLessons } from "@/hooks/useApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lessonsApi } from "@/lib/api";
import { AccessCodeDialog } from "@/components/admin/AccessCodeDialog";
import { SortableLessonList } from "@/components/admin/SortableLessonList";
import { toast } from "@/hooks/use-toast";

export default function AdminLessons() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newLesson, setNewLesson] = useState({
    courseId: "",
    title: "",
    durationMinutes: 15,
    maxPauses: 3,
  });
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [previewLesson, setPreviewLesson] = useState<any | null>(null);
  const [accessCodeLesson, setAccessCodeLesson] = useState<any | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: coursesData, isLoading: coursesLoading } = useCourses({ noPagination: 'true' }); // Fetch all courses for dropdown
  const courses = coursesData?.courses || [];

  // Fetch all lessons - depends on courses being loaded
  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ["allLessons", courses.map((c: any) => c.id)],
    queryFn: async () => {
      // Fetch lessons from all courses
      const allLessons: any[] = [];
      for (const course of courses) {
        try {
          const result = await lessonsApi.getByCourse(course.id);
          if (result?.lessons) {
            allLessons.push(
              ...result.lessons.map((l: any) => ({
                ...l,
                courseName: course.title,
              }))
            );
          }
        } catch (e) {
          // Skip courses that fail
        }
      }
      return allLessons;
    },
    enabled: courses.length > 0,
  });

  const isLoading = coursesLoading || lessonsLoading;

  const queryClient = useQueryClient();
  const deleteLesson = useDeleteLesson();
  const reorderLessons = useReorderLessons();

  const lessons = (lessonsData || []).filter((lesson: any) => {
    const matchesSearch = lesson.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCourse =
      selectedCourse === "all" || lesson.courseId === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  // Group lessons by course for better organization and reordering
  const lessonsByCourse = useMemo(() => {
    const grouped: Record<string, { courseName: string; lessons: any[] }> = {};

    for (const lesson of lessons) {
      const courseId = lesson.courseId;
      if (!grouped[courseId]) {
        grouped[courseId] = {
          courseName: lesson.courseName || "Unknown Course",
          lessons: [],
        };
      }
      grouped[courseId].lessons.push(lesson);
    }

    // Sort lessons within each course by order_index
    for (const courseId of Object.keys(grouped)) {
      grouped[courseId].lessons.sort((a, b) => {
        const orderA = a.orderIndex ?? a.order_index ?? 0;
        const orderB = b.orderIndex ?? b.order_index ?? 0;
        return orderA - orderB;
      });
    }

    return grouped;
  }, [lessons]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateOrUpdateLesson = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("courseId", newLesson.courseId);
      formData.append("title", newLesson.title);
      formData.append("durationMinutes", String(newLesson.durationMinutes));
      formData.append("maxPauses", String(newLesson.maxPauses));

      if (selectedFile) {
        formData.append("audio", selectedFile);
      }

      const onProgress = (progress: number) => {
        setUploadProgress(progress);
      };

      if (editingLesson) {
        await lessonsApi.updateWithProgress(
          editingLesson.id,
          formData,
          onProgress
        );
        toast({ title: "Lesson updated successfully!" });
      } else {
        await lessonsApi.createWithProgress(formData, onProgress);
        toast({ title: "Lesson created successfully!" });
      }

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "allLessons",
      });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      // Also invalidate courses to update lesson counts
      queryClient.invalidateQueries({ queryKey: ["courses"] });

      setIsCreateOpen(false);
      setEditingLesson(null);
      setNewLesson({
        courseId: "",
        title: "",
        durationMinutes: 15,
        maxPauses: 3,
      });
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Failed to save lesson:", error);
      toast({
        title: "Failed to save lesson",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openEditDialog = (lesson: any) => {
    setEditingLesson(lesson);
    setNewLesson({
      courseId: lesson.courseId,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes || 15,
      maxPauses: lesson.maxPauses || 3,
    });
    setIsCreateOpen(true);
  };

  const openPreview = (lesson: any) => {
    if (lesson.audioUrl) {
      setPreviewLesson(lesson);
    } else {
      alert("No audio uploaded for this lesson.");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      try {
        await deleteLesson.mutateAsync(lessonId);
      } catch (error) {
        console.error("Failed to delete lesson:", error);
      }
    }
  };

  const totalLessons = lessons.length;
  const withAudio = lessons.filter((l: any) => l.audioUrl).length;
  const pendingUpload = totalLessons - withAudio;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:ml-64">
          <AdminHeader
            title="Lesson Management"
            subtitle="Upload and configure audio lessons"
          />
          <main className="p-4 lg:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminHeader
          title="Lesson Management"
          subtitle="Upload and configure audio lessons"
        />

        <main className="p-4 lg:p-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 lg:w-80 pl-9"
                />
              </div>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog
              open={isCreateOpen}
              onOpenChange={(open) => {
                setIsCreateOpen(open);
                if (!open) {
                  setEditingLesson(null);
                  setNewLesson({
                    courseId: "",
                    title: "",
                    durationMinutes: 15,
                    maxPauses: 3,
                  });
                  setSelectedFile(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="premium" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingLesson ? "Edit Lesson" : "Add New Lesson"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Lesson Title</Label>
                    <Input
                      value={newLesson.title}
                      onChange={(e) =>
                        setNewLesson((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter lesson title"
                      disabled={isUploading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select
                      value={newLesson.courseId}
                      onValueChange={(v) =>
                        setNewLesson((prev) => ({ ...prev, courseId: v }))
                      }
                      disabled={isUploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={newLesson.durationMinutes}
                        onChange={(e) =>
                          setNewLesson((prev) => ({
                            ...prev,
                            durationMinutes: Number(e.target.value),
                          }))
                        }
                        placeholder="15"
                        disabled={isUploading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Pauses</Label>
                      <Input
                        type="number"
                        value={newLesson.maxPauses}
                        onChange={(e) =>
                          setNewLesson((prev) => ({
                            ...prev,
                            maxPauses: Number(e.target.value),
                          }))
                        }
                        placeholder="3"
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Audio File</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 lg:p-8 text-center bg-muted/20 relative">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                      />
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">
                          {selectedFile
                            ? selectedFile.name
                            : editingLesson?.audioUrl
                              ? "Change audio file"
                              : "Click or drag audio file here"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          MP3, WAV, M4A up to 100MB
                        </p>
                        {editingLesson?.audioUrl && !selectedFile && (
                          <p className="text-xs text-success mt-2">
                            ✓ Current audio available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label>Allow Seeking</Label>
                      <p className="text-xs text-muted-foreground">
                        Let users skip forward/backward
                      </p>
                    </div>
                    <Switch disabled={isUploading} />
                  </div>

                  {/* Upload Progress Bar */}
                  {isUploading && (
                    <div className="space-y-2 py-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {uploadProgress < 100
                            ? "Uploading audio..."
                            : "Processing..."}
                        </span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                      disabled={isUploading}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="premium"
                      onClick={handleCreateOrUpdateLesson}
                      disabled={isUploading}
                      className="w-full sm:w-auto"
                    >
                      {isUploading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {uploadProgress < 100
                            ? `Uploading ${uploadProgress}%`
                            : "Processing..."}
                        </span>
                      ) : editingLesson ? (
                        "Update Lesson"
                      ) : (
                        "Create Lesson"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={!!previewLesson}
              onOpenChange={() => setPreviewLesson(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{previewLesson?.title || "Preview"}</DialogTitle>
                </DialogHeader>
                <div className="py-6 flex flex-col items-center">
                  <audio controls className="w-full">
                    {previewLesson?.audioUrl && (
                      <source src={previewLesson.audioUrl} />
                    )}
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                Total Lessons
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">
                {totalLessons}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                With Audio
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-success">
                {withAudio}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                Pending Upload
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-warning">
                {pendingUpload}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                Total Courses
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">
                {courses.length}
              </p>
            </div>
          </div>

          {/* Lessons List with Reordering */}
          <div className="space-y-6">
            {Object.entries(lessonsByCourse).map(([courseId, { courseName, lessons: courseLessons }]) => (
              <SortableLessonList
                key={courseId}
                lessons={courseLessons}
                courseId={courseId}
                courseName={courseName}
                onEdit={openEditDialog}
                onPreview={openPreview}
                onManageAccessCode={(lesson) => setAccessCodeLesson(lesson)}
                onDelete={handleDeleteLesson}
                onReorder={async (cId, lessonIds) => {
                  await reorderLessons.mutateAsync({ courseId: cId, lessonIds });
                }}
                isReordering={reorderLessons.isPending}
              />
            ))}

            {Object.keys(lessonsByCourse).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No lessons found. Create your first lesson to get started.</p>
              </div>
            )}
          </div>

          {/* Access Code Management Dialog */}
          {accessCodeLesson && (
            <AccessCodeDialog
              lessonId={accessCodeLesson.id}
              lessonTitle={accessCodeLesson.title}
              open={!!accessCodeLesson}
              onOpenChange={(open) => !open && setAccessCodeLesson(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
