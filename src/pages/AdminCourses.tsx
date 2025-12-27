import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockCourses } from '@/data/mockData';
import { Course } from '@/types';
import { Plus, Search, Filter, MoreHorizontal, BookOpen, Clock, Users } from 'lucide-react';
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

const courseColumns = [
  {
    key: 'title',
    header: 'Course',
    render: (course: Course) => (
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{course.title}</p>
          <p className="text-sm text-muted-foreground">{course.totalLessons} lessons • {course.duration}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    render: (course: Course) => (
      <Badge variant={course.type === 'self' ? 'self' : 'onsite'}>
        {course.type === 'self' ? 'Self-Paced' : 'On-Site'}
      </Badge>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (course: Course) => (
      <Badge variant={course.status === 'active' ? 'active' : course.status === 'completed' ? 'completed' : 'locked'}>
        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
      </Badge>
    ),
  },
  {
    key: 'price',
    header: 'Price',
    render: (course: Course) => (
      <span className="font-semibold text-foreground">
        {course.price ? `$${course.price}` : 'Free'}
      </span>
    ),
  },
  {
    key: 'enrollments',
    header: 'Enrollments',
    render: () => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{Math.floor(Math.random() * 200) + 50}</span>
      </div>
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
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Edit Course</DropdownMenuItem>
          <DropdownMenuItem>Manage Lessons</DropdownMenuItem>
          <DropdownMenuItem>View Enrollments</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: 'w-12',
  },
];

export default function AdminCourses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredCourses = mockCourses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64">
        <AdminHeader title="Course Management" subtitle="Create and manage therapy courses" />
        
        <main className="p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="premium">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif">Create New Course</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Course Title</Label>
                    <Input placeholder="Enter course title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Enter course description" rows={4} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select>
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
                      <Input type="number" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select>
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
                      <Input placeholder="e.g., 6 hours" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button variant="premium" onClick={() => setIsCreateOpen(false)}>Create Course</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Total Courses</p>
              <p className="font-serif text-2xl font-bold text-foreground">24</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="font-serif text-2xl font-bold text-success">18</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Self-Paced</p>
              <p className="font-serif text-2xl font-bold text-foreground">15</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">On-Site</p>
              <p className="font-serif text-2xl font-bold text-foreground">9</p>
            </div>
          </div>

          {/* Courses Table */}
          <DataTable columns={courseColumns} data={filteredCourses} />
        </main>
      </div>
    </div>
  );
}
