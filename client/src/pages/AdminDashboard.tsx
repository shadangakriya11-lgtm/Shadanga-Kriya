import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatCard } from '@/components/admin/StatCard';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BookOpen, DollarSign, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { useDashboardAnalytics, useUsers, useCourses } from '@/hooks/useApi';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();
  const { data: usersData, isLoading: usersLoading } = useUsers({ limit: '5' });
  const { data: coursesData, isLoading: coursesLoading } = useCourses({ limit: '5' });

  const isLoading = analyticsLoading || usersLoading || coursesLoading;

  const stats = analytics || {
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    revenue: 0,
    completionRate: 0,
    alerts: 0,
  };

  const users = usersData?.users || [];
  const courses = coursesData?.courses || [];

  const userColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (user: any) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {(user.first_name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: any) => (
        <Badge variant={user.role === 'admin' ? 'default' : user.role === 'facilitator' ? 'secondary' : 'outline'}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user: any) => (
        <Badge variant={user.is_active ? 'active' : 'locked'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (user: any) => (
        <span className="text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const courseColumns = [
    {
      key: 'title',
      header: 'Course',
      render: (course: any) => (
        <div>
          <p className="font-medium text-foreground">{course.title}</p>
          <p className="text-xs text-muted-foreground">{course.total_lessons || 0} lessons</p>
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
          {course.status}
        </Badge>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (course: any) => (
        <span className="font-medium">₹{course.price || 0}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:ml-64">
          <AdminHeader title="Dashboard" subtitle="Overview of your therapy platform" />
          <main className="p-4 lg:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminHeader title="Dashboard" subtitle="Overview of your therapy platform" />

        <main className="p-4 lg:p-6">
          {/* Stats Grid */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
            <StatCard
              icon={Users}
              title="Total Users"
              value={stats.totalUsers?.toLocaleString() || '0'}
              change="+12%"
              trend="up"
              style={{ animationDelay: '0ms' }}
            />
            <StatCard
              icon={Activity}
              title="Active Users"
              value={stats.activeUsers?.toLocaleString() || '0'}
              change="+8%"
              trend="up"
              style={{ animationDelay: '100ms' }}
            />
            <StatCard
              icon={BookOpen}
              title="Total Courses"
              value={stats.totalCourses || '0'}
              change="+2"
              trend="up"
              style={{ animationDelay: '200ms' }}
            />
            <StatCard
              icon={DollarSign}
              title="Revenue"
              value={`₹${((stats.revenue || 0) / 1000).toFixed(1)}k`}
              change="+23%"
              trend="up"
              style={{ animationDelay: '300ms' }}
            />
          </section>

          {/* Secondary Stats */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">
            <div className="bg-card rounded-xl border border-border/50 p-4 lg:p-6 shadow-soft animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base lg:text-lg font-semibold text-foreground">Completion Rate</h3>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="flex items-end gap-2 lg:gap-4">
                <span className="font-serif text-3xl lg:text-5xl font-bold text-foreground">{stats.completionRate || 0}%</span>
                <span className="text-xs lg:text-sm text-success mb-1 lg:mb-2">+5% from last month</span>
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                  style={{ width: `${stats.completionRate || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-4 lg:p-6 shadow-soft animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base lg:text-lg font-semibold text-foreground">Active Alerts</h3>
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex items-end gap-2 lg:gap-4">
                <span className="font-serif text-3xl lg:text-5xl font-bold text-foreground">{stats.alerts || 0}</span>
                <span className="text-xs lg:text-sm text-muted-foreground mb-1 lg:mb-2">interruptions today</span>
              </div>
              <Button variant="warning" size="sm" className="mt-4">
                Review Alerts
              </Button>
            </div>
          </section>

          {/* Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            <section className="animate-fade-in" style={{ animationDelay: '600ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base lg:text-lg font-semibold text-foreground">Recent Users</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>View All</Button>
              </div>
              <div className="overflow-x-auto">
                <DataTable columns={userColumns} data={users} />
              </div>
            </section>

            <section className="animate-fade-in" style={{ animationDelay: '700ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base lg:text-lg font-semibold text-foreground">Courses</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/courses')}>View All</Button>
              </div>
              <div className="overflow-x-auto">
                <DataTable columns={courseColumns} data={courses} />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
