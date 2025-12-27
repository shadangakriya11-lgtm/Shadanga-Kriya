import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockLessons, mockCourses } from '@/data/mockData';
import { Lesson } from '@/types';
import { Plus, Search, Filter, MoreHorizontal, Upload, Clock, Pause, Play } from 'lucide-react';
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

const lessonColumns = [
  {
    key: 'title',
    header: 'Lesson',
    render: (lesson: Lesson) => {
      const course = mockCourses.find(c => c.id === lesson.courseId);
      return (
        <div>
          <p className="font-medium text-foreground">{lesson.title}</p>
          <p className="text-sm text-muted-foreground">{course?.title}</p>
        </div>
      );
    },
  },
  {
    key: 'order',
    header: 'Order',
    render: (lesson: Lesson) => (
      <span className="text-muted-foreground">#{lesson.order}</span>
    ),
  },
  {
    key: 'duration',
    header: 'Duration',
    render: (lesson: Lesson) => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{lesson.duration}</span>
      </div>
    ),
  },
  {
    key: 'maxPauses',
    header: 'Max Pauses',
    render: (lesson: Lesson) => (
      <div className="flex items-center gap-2">
        <Pause className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{lesson.maxPauses}</span>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (lesson: Lesson) => (
      <Badge variant={lesson.status === 'active' ? 'active' : lesson.status === 'completed' ? 'completed' : 'locked'}>
        {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
      </Badge>
    ),
  },
  {
    key: 'audio',
    header: 'Audio',
    render: (lesson: Lesson) => (
      <Badge variant={lesson.audioUrl ? 'active' : 'locked'}>
        {lesson.audioUrl ? 'Uploaded' : 'Pending'}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: '',
    render: () => (
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
          <DropdownMenuItem>Reorder</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: 'w-12',
  },
];

export default function AdminLessons() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredLessons = mockLessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64">
        <AdminHeader title="Lesson Management" subtitle="Upload and configure audio lessons" />
        
        <main className="p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-9"
                />
              </div>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {mockCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="premium">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif">Add New Lesson</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Lesson Title</Label>
                    <Input placeholder="Enter lesson title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input type="number" placeholder="15" />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Pauses</Label>
                      <Input type="number" placeholder="3" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Audio File (Encrypted)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
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
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button variant="premium" onClick={() => setIsCreateOpen(false)}>Create Lesson</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Total Lessons</p>
              <p className="font-serif text-2xl font-bold text-foreground">156</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">With Audio</p>
              <p className="font-serif text-2xl font-bold text-success">142</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Pending Upload</p>
              <p className="font-serif text-2xl font-bold text-warning">14</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="font-serif text-2xl font-bold text-foreground">48h</p>
            </div>
          </div>

          {/* Lessons Table */}
          <DataTable columns={lessonColumns} data={filteredLessons} />
        </main>
      </div>
    </div>
  );
}
