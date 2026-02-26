import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FacilitatorSidebar } from '@/components/facilitator/FacilitatorSidebar';
import { FacilitatorHeader } from '@/components/facilitator/FacilitatorHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MoreHorizontal, Plus, RotateCcw, Lock, Pause, LockIcon, ShieldAlert } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useMonitoringStats, useCourses } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

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
    lastActivity: Date | string;
}

const progressColumns = [
    {
        key: 'user',
        header: 'User',
        render: (item: UserLessonProgress) => (
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {(item.userName || 'U').split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                    <p className="font-medium text-foreground">{item.userName}</p>
                    <p className="text-sm text-muted-foreground text-xs truncate max-w-[150px]">{item.userEmail}</p>
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
                <Badge variant={variants[item.status] || 'outline'}>
                    {(item.status || 'Unknown').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
            );
        },
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
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        className: 'w-12',
    },
];

export default function FacilitatorMonitoring() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const filterCourseId = searchParams.get('courseId');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const hasPermission = user?.role === 'admin' || user?.permissions?.includes('monitoring');

    const { data, isLoading } = useMonitoringStats();
    const { data: coursesData } = useCourses({ noPagination: 'true' }); // Fetch all courses for filter

    const monitoringData = useMemo(() => {
        let list = data?.monitoring || [];
        if (filterCourseId && coursesData?.courses) {
            const course = coursesData.courses.find((c: any) => c.id === filterCourseId);
            if (course) {
                list = list.filter((m: any) => m.courseTitle === (course.title));
            }
        }
        return list as UserLessonProgress[];
    }, [data, filterCourseId, coursesData]);
    const stats = data?.stats || { activeSessions: 0, completedToday: 0, interrupted: 0, pauseRequests: 0 };

    const filteredProgress = monitoringData.filter((item: UserLessonProgress) => {
        const matchesSearch = (item.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.lessonTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (!hasPermission && !isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <FacilitatorSidebar />
                <div className="lg:ml-64">
                    <FacilitatorHeader title="Lesson Monitoring" subtitle="Track user progress and manage playback" />
                    <main className="p-4 lg:p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
                            <ShieldAlert className="h-10 w-10 text-warning" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold mb-2">Access Restricted</h2>
                        <p className="text-muted-foreground max-w-md mb-8">
                            You don't have permission to view the monitoring dashboard.
                            Please request permission from the administrator to access this feature.
                        </p>
                        <div className="p-4 bg-muted rounded-lg border border-border text-sm font-medium">
                            Required Permission: Lesson Monitoring (monitoring)
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <FacilitatorSidebar />
                <div className="lg:ml-64">
                    <FacilitatorHeader title="Lesson Monitoring" subtitle="Track user progress and manage playback" />
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
            <FacilitatorSidebar />

            <div className="lg:ml-64">
                <FacilitatorHeader title="Lesson Monitoring" subtitle="Track user progress and manage playback" />

                <main className="p-4 lg:p-6">
                    {/* Actions Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by user or lesson..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-64 lg:w-80 pl-9"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
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
                        <div className="text-xs text-muted-foreground self-center">
                            Live updates active
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
                        <div className="bg-card rounded-xl border border-border/50 p-4">
                            <p className="text-xs lg:text-sm text-muted-foreground">Active Sessions</p>
                            <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">{stats.activeSessions}</p>
                        </div>
                        <div className="bg-card rounded-xl border border-border/50 p-4">
                            <p className="text-xs lg:text-sm text-muted-foreground">Completed Today</p>
                            <p className="font-serif text-xl lg:text-2xl font-bold text-success">{stats.completedToday}</p>
                        </div>
                        <div className="bg-card rounded-xl border border-border/50 p-4">
                            <p className="text-xs lg:text-sm text-muted-foreground">Interrupted</p>
                            <p className="font-serif text-xl lg:text-2xl font-bold text-destructive">{stats.interrupted}</p>
                        </div>
                        <div className="bg-card rounded-xl border border-border/50 p-4">
                            <p className="text-xs lg:text-sm text-muted-foreground">Pause Requests</p>
                            <p className="font-serif text-xl lg:text-2xl font-bold text-warning">{stats.pauseRequests}</p>
                        </div>
                    </div>

                    {/* Progress Table */}
                    <div className="overflow-x-auto">
                        <DataTable columns={progressColumns} data={filteredProgress} />
                    </div>
                </main>
            </div>
        </div>
    );
}
