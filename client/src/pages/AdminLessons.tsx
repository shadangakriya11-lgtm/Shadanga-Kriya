import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, MoreHorizontal, Upload, Clock, Pause, KeyRound } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCourses, useCreateLesson, useUpdateLesson, useDeleteLesson } from '@/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { lessonsApi } from '@/lib/api';
import { AccessCodeDialog } from '@/components/admin/AccessCodeDialog';

export default function AdminLessons() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLesson, setNewLesson] = useState({
    courseId: '',
    title: '',
    durationMinutes: 15,
    maxPauses: 3,
  });
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [previewLesson, setPreviewLesson] = useState<any | null>(null);
  const [accessCodeLesson, setAccessCodeLesson] = useState<any | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: coursesData } = useCourses();
  const courses = coursesData?.courses || [];

  // Fetch all lessons
  const { data: lessonsData, isLoading } = useQuery({
    queryKey: ['allLessons'],
    queryFn: async () => {
      // Fetch lessons from all courses
      const allLessons: any[] = [];
      for (const course of courses) {
        try {
          const result = await lessonsApi.getByCourse(course.id);
          if (result?.lessons) {
            allLessons.push(...result.lessons.map((l: any) => ({ ...l, courseName: course.title })));
          }
        } catch (e) {
          // Skip courses that fail
        }
      }
      return allLessons;
    },
    enabled: courses.length > 0,
  });

  const createLesson = useCreateLesson();
  const deleteLesson = useDeleteLesson();
  const updateLesson = useUpdateLesson(); // Assuming this hook exists or creating it

  // Reuse the existing hook if available or import it
  // import { useUpdateLesson } from '@/hooks/useApi'; 

  const lessons = (lessonsData || []).filter((lesson: any) => {
    const matchesSearch = lesson.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || lesson.courseId === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateOrUpdateLesson = async () => {
    try {
      const formData = new FormData();
      formData.append('courseId', newLesson.courseId);
      formData.append('title', newLesson.title);
      formData.append('durationMinutes', String(newLesson.durationMinutes));
      formData.append('maxPauses', String(newLesson.maxPauses));

      if (selectedFile) {
        formData.append('audio', selectedFile);
      }

      if (editingLesson) {
        await updateLesson.mutateAsync({ id: editingLesson.id, data: formData });
      } else {
        await createLesson.mutateAsync(formData);
      }

      setIsCreateOpen(false);
      setEditingLesson(null);
      setNewLesson({ courseId: '', title: '', durationMinutes: 15, maxPauses: 3 });
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to save lesson:', error);
    }
  };

  const openEditDialog = (lesson: any) => {
    setEditingLesson(lesson);
    setNewLesson({
      courseId: lesson.courseId,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes || 15,
      maxPauses: lesson.maxPauses || 3
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
    if (confirm('Are you sure you want to delete this lesson?')) {
      try {
        await deleteLesson.mutateAsync(lessonId);
      } catch (error) {
        console.error('Failed to delete lesson:', error);
      }
    }
  };

  const lessonColumns = [
    {
      key: 'title',
      header: 'Lesson',
      render: (lesson: any) => (
        <div>
          <p className="font-medium text-foreground">{lesson.title}</p>
          <p className="text-sm text-muted-foreground">{lesson.courseName || 'Unknown Course'}</p>
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (lesson: any) => (
        <span className="text-muted-foreground">#{lesson.order_index || 1}</span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (lesson: any) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {lesson.durationMinutes
              ? `${lesson.durationMinutes} min`
              : (lesson.duration_seconds ? `${Math.round(lesson.duration_seconds / 60)} min` : '0 min')}
          </span>
        </div>
      ),
    },
    {
      key: 'maxPauses',
      header: 'Max Pauses',
      render: (lesson: any) => (
        <div className="flex items-center gap-2">
          <Pause className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{lesson.max_pauses || 3}</span>
        </div>
      ),
    },
    {
      key: 'audio',
      header: 'Audio',
      render: (lesson: any) => (
        <Badge variant={lesson.audioUrl ? 'active' : 'locked'}>
          {lesson.audioUrl ? 'Uploaded' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'accessCode',
      header: 'Access Code',
      render: (lesson: any) => (
        <div className="flex items-center gap-2">
          {lesson.accessCodeEnabled ? (
            <Badge variant={lesson.hasAccessCode ? (lesson.accessCodeExpired ? 'destructive' : 'default') : 'secondary'}>
              <KeyRound className="h-3 w-3 mr-1" />
              {lesson.hasAccessCode ? (lesson.accessCodeExpired ? 'Expired' : 'Active') : 'No Code'}
            </Badge>
          ) : (
            <Badge variant="outline">Disabled</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (lesson: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditDialog(lesson)}>
              Edit Lesson
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditDialog(lesson)}>
              Upload Audio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openPreview(lesson)} disabled={!lesson.audioUrl}>
              Preview
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setAccessCodeLesson(lesson)}>
              <KeyRound className="h-4 w-4 mr-2" />
              Manage Access Code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12',
    },
  ];

  const totalLessons = lessons.length;
  const withAudio = lessons.filter((l: any) => l.audioUrl).length;
  const pendingUpload = totalLessons - withAudio;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:ml-64">
          <AdminHeader title="Lesson Management" subtitle="Upload and configure audio lessons" />
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
        <AdminHeader title="Lesson Management" subtitle="Upload and configure audio lessons" />

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
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                setEditingLesson(null);
                setNewLesson({ courseId: '', title: '', durationMinutes: 15, maxPauses: 3 });
                setSelectedFile(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="premium" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif">{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Lesson Title</Label>
                    <Input
                      value={newLesson.title}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter lesson title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select
                      value={newLesson.courseId}
                      onValueChange={(v) => setNewLesson(prev => ({ ...prev, courseId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
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
                        onChange={(e) => setNewLesson(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Pauses</Label>
                      <Input
                        type="number"
                        value={newLesson.maxPauses}
                        onChange={(e) => setNewLesson(prev => ({ ...prev, maxPauses: Number(e.target.value) }))}
                        placeholder="3"
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
                      />
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">
                          {selectedFile ? selectedFile.name : (editingLesson?.audioUrl ? 'Change audio file' : 'Click or drag audio file here')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A up to 100MB</p>
                        {editingLesson?.audioUrl && !selectedFile && (
                          <p className="text-xs text-success mt-2">✓ Current audio available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label>Allow Seeking</Label>
                      <p className="text-xs text-muted-foreground">Let users skip forward/backward</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                    <Button variant="premium" onClick={handleCreateOrUpdateLesson} disabled={createLesson.isPending || updateLesson.isPending} className="w-full sm:w-auto">
                      {createLesson.isPending || updateLesson.isPending ? 'Saving...' : (editingLesson ? 'Update Lesson' : 'Create Lesson')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={!!previewLesson} onOpenChange={() => setPreviewLesson(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{previewLesson?.title || 'Preview'}</DialogTitle>
                </DialogHeader>
                <div className="py-6 flex flex-col items-center">
                  <audio controls className="w-full">
                    {previewLesson?.audioUrl && <source src={previewLesson.audioUrl} />}
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Total Lessons</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">{totalLessons}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">With Audio</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-success">{withAudio}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Pending Upload</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-warning">{pendingUpload}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Total Courses</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">{courses.length}</p>
            </div>
          </div>

          {/* Lessons Table */}
          <div className="overflow-x-auto">
            <DataTable columns={lessonColumns} data={lessons} />
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
