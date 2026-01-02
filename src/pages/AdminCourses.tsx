import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Filter, MoreHorizontal, BookOpen, Users } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCourses, useCourseStats, useCreateCourse, useUpdateCourse, useDeleteCourse } from '@/hooks/useApi';

export default function AdminCourses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    type: 'self',
    price: 0,
    status: 'active',
    duration: ''
  });

  const navigate = useNavigate();
  const { data: coursesData, isLoading } = useCourses();
  const { data: statsData } = useCourseStats();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const courses = (coursesData?.courses || []).filter((course: any) =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const stats = statsData || { total: 0, active: 0, selfPaced: 0, onsite: 0 };

  const handleCreateOrUpdateCourse = async () => {
    try {
      if (editingCourse) {
        await updateCourse.mutateAsync({ id: editingCourse.id, data: newCourse });
      } else {
        await createCourse.mutateAsync(newCourse);
      }
      setIsCreateOpen(false);
      setEditingCourse(null);
      setNewCourse({ title: '', description: '', type: 'self', price: 0, status: 'active', duration: '' });
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  const openEditDialog = (course: any) => {
    setEditingCourse(course);
    setNewCourse({
      title: course.title,
      description: course.description || '',
      type: course.type || 'self',
      price: Number(course.price) || 0,
      status: course.status || 'active',
      duration: course.duration || ''
    });
    setIsCreateOpen(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse.mutateAsync(courseId);
      } catch (error) {
        console.error('Failed to delete course:', error);
      }
    }
  };

  const courseColumns = [
    {
      key: 'title',
      header: 'Course',
      render: (course: any) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{course.title}</p>
            <p className="text-sm text-muted-foreground">{course.total_lessons || 0} lessons • {course.duration || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (course: any) => (
        <Badge variant={course.type === 'self' ? 'self' : 'onsite'}>
          {course.type === 'self' ? 'Self-Paced' : 'On-Site'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (course: any) => (
        <Badge variant={course.status === 'active' ? 'active' : course.status === 'completed' ? 'completed' : 'locked'}>
          {course.status?.charAt(0).toUpperCase() + course.status?.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (course: any) => (
        <span className="font-semibold text-foreground">
          {course.price ? `$${course.price}` : 'Free'}
        </span>
      ),
    },
    {
      key: 'enrollments',
      header: 'Enrollments',
      render: (course: any) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{course.enrollment_count || 0}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (course: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditDialog(course)}>Edit Course</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/admin/lessons`)}>Manage Lessons</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCourse(course.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:ml-64">
          <AdminHeader title="Course Management" subtitle="Create and manage therapy courses" />
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
        <AdminHeader title="Course Management" subtitle="Create and manage therapy courses" />

        <main className="p-4 lg:p-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 lg:w-80 pl-9"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                setEditingCourse(null);
                setNewCourse({ title: '', description: '', type: 'self', price: 0, status: 'active', duration: '' });
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="premium" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif">{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Course Title</Label>
                    <Input
                      value={newCourse.title}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter course title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter course description"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newCourse.type}
                        onValueChange={(v) => setNewCourse(prev => ({ ...prev, type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">Self-Paced</SelectItem>
                          <SelectItem value="onsite">On-Site</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input
                        type="number"
                        value={newCourse.price}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, price: Number(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={newCourse.status}
                        onValueChange={(v) => setNewCourse(prev => ({ ...prev, status: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="locked">Locked</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        value={newCourse.duration}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g., 6 hours"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                    <Button variant="premium" onClick={handleCreateOrUpdateCourse} disabled={createCourse.isPending || updateCourse.isPending} className="w-full sm:w-auto">
                      {createCourse.isPending || updateCourse.isPending ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Total Courses</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Active</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-success">{stats.active}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Self-Paced</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">{stats.selfPaced}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">On-Site</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">{stats.onsite}</p>
            </div>
          </div>

          {/* Courses Table */}
          <div className="overflow-x-auto">
            <DataTable columns={courseColumns} data={courses} />
          </div>
        </main>
      </div>
    </div>
  );
}
