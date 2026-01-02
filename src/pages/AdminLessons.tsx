import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, MoreHorizontal, Upload, Clock, Pause } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useCourses, useCreateLesson, useDeleteLesson } from '@/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { lessonsApi } from '@/lib/api';

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

  const lessons = (lessonsData || []).filter((lesson: any) => {
    const matchesSearch = lesson.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || lesson.course_id === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const handleCreateLesson = async () => {
    try {
      await createLesson.mutateAsync(newLesson);
      setIsCreateOpen(false);
      setNewLesson({ courseId: '', title: '', durationMinutes: 15, maxPauses: 3 });
    } catch (error) {
      console.error('Failed to create lesson:', error);
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
          <span className="text-muted-foreground">{lesson.duration || `${lesson.duration_seconds / 60} min`}</span>
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
        <Badge variant={lesson.audio_url ? 'active' : 'locked'}>
          {lesson.audio_url ? 'Uploaded' : 'Pending'}
        </Badge>
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
            <DropdownMenuItem>Edit Lesson</DropdownMenuItem>
            <DropdownMenuItem>Upload Audio</DropdownMenuItem>
            <DropdownMenuItem>Preview</DropdownMenuItem>
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
  const withAudio = lessons.filter((l: any) => l.audio_url).length;
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
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="premium" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif">Add New Lesson</DialogTitle>
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
                    <Label>Audio File (Encrypted)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 lg:p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Drag & drop audio file or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">MP3, WAV up to 100MB</p>
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
                    <Button variant="premium" onClick={handleCreateLesson} disabled={createLesson.isPending} className="w-full sm:w-auto">
                      {createLesson.isPending ? 'Creating...' : 'Create Lesson'}
                    </Button>
                  </div>
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
        </main>
      </div>
    </div>
  );
}
