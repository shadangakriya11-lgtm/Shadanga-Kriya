import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockUsers, mockLessons, mockCourses } from '@/data/mockData';
import { Search, Filter, MoreHorizontal, Play, Pause, RotateCcw, Lock, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

interface UserLessonProgress {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  progress: number;
  pausesUsed: number;
  maxPauses: number;
  status: 'in_progress' | 'completed' | 'paused' | 'interrupted';
  lastActivity: Date;
}

const mockProgress: UserLessonProgress[] = [
  {
    id: 'p1',
    userId: 'u1',
    userName: 'Sarah Mitchell',
    userEmail: 'sarah.m@example.com',
    lessonId: 'l5',
    lessonTitle: 'The 4-7-8 Technique',
    courseTitle: 'Foundations of Mindful Breathing',
    progress: 65,
    pausesUsed: 2,
    maxPauses: 3,
    status: 'in_progress',
    lastActivity: new Date('2024-12-27T10:30:00'),
  },
  {
    id: 'p2',
    userId: 'u2',
    userName: 'James Chen',
    userEmail: 'james.chen@example.com',
    lessonId: 'l3',
    lessonTitle: 'Rhythmic Breath Patterns',
    courseTitle: 'Foundations of Mindful Breathing',
    progress: 100,
    pausesUsed: 1,
    maxPauses: 3,
    status: 'completed',
    lastActivity: new Date('2024-12-26T15:45:00'),
  },
  {
    id: 'p3',
    userId: 'u1',
    userName: 'Sarah Mitchell',
    userEmail: 'sarah.m@example.com',
    lessonId: 'l2',
    lessonTitle: 'Diaphragmatic Breathing',
    courseTitle: 'Foundations of Mindful Breathing',
    progress: 45,
    pausesUsed: 3,
    maxPauses: 3,
    status: 'interrupted',
    lastActivity: new Date('2024-12-25T09:15:00'),
  },
];

const progressColumns = [
  {
    key: 'user',
    header: 'User',
    render: (item: UserLessonProgress) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
          {item.userName.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="font-medium text-foreground">{item.userName}</p>
          <p className="text-sm text-muted-foreground">{item.userEmail}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'lesson',
    header: 'Lesson',
    render: (item: UserLessonProgress) => (
      <div>
        <p className="font-medium text-foreground">{item.lessonTitle}</p>
        <p className="text-sm text-muted-foreground">{item.courseTitle}</p>
      </div>
    ),
  },
  {
    key: 'progress',
    header: 'Progress',
    render: (item: UserLessonProgress) => (
      <div className="w-32">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{item.progress}%</span>
        </div>
        <Progress value={item.progress} className="h-2" />
      </div>
    ),
  },
  {
    key: 'pauses',
    header: 'Pauses',
    render: (item: UserLessonProgress) => (
      <div className="flex items-center gap-2">
        <Pause className="h-4 w-4 text-muted-foreground" />
        <span className={item.pausesUsed >= item.maxPauses ? 'text-destructive font-medium' : 'text-muted-foreground'}>
          {item.pausesUsed} / {item.maxPauses}
        </span>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (item: UserLessonProgress) => {
      const variants: Record<string, 'active' | 'completed' | 'pending' | 'locked'> = {
        in_progress: 'active',
        completed: 'completed',
        paused: 'pending',
        interrupted: 'locked',
      };
      return (
        <Badge variant={variants[item.status]}>
          {item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      );
    },
  },
  {
    key: 'lastActivity',
    header: 'Last Activity',
    render: (item: UserLessonProgress) => (
      <span className="text-muted-foreground">
        {item.lastActivity.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    render: (item: UserLessonProgress) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Plus className="h-4 w-4 mr-2" />
            Grant Extra Pause
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Lesson
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Lock className="h-4 w-4 mr-2" />
            Lock Lesson
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: 'w-12',
  },
];

export default function AdminMonitoring() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProgress = mockProgress.filter((item) => {
    const matchesSearch = item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64">
        <AdminHeader title="Lesson Monitoring" subtitle="Track user progress and manage playback" />
        
        <main className="p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or lesson..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-9"
                />
              </div>
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('in_progress')}
              >
                In Progress
              </Button>
              <Button 
                variant={statusFilter === 'interrupted' ? 'warning' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('interrupted')}
              >
                Interrupted
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="font-serif text-2xl font-bold text-foreground">47</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <p className="font-serif text-2xl font-bold text-success">156</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Interrupted</p>
              <p className="font-serif text-2xl font-bold text-destructive">12</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Pause Requests</p>
              <p className="font-serif text-2xl font-bold text-warning">8</p>
            </div>
          </div>

          {/* Progress Table */}
          <DataTable columns={progressColumns} data={filteredProgress} />
        </main>
      </div>
    </div>
  );
}
