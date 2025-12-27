import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatCard } from '@/components/admin/StatCard';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardStats, mockUsers, mockCourses } from '@/data/mockData';
import { Users, BookOpen, DollarSign, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { User, Course } from '@/types';

const userColumns = [
  {
    key: 'name',
    header: 'Name',
    render: (user: User) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
          {user.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    render: (user: User) => (
      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'subadmin' ? 'secondary' : 'outline'}>
        {user.role}
      </Badge>
    ),
  },
  {
    key: 'isActive',
    header: 'Status',
    render: (user: User) => (
      <Badge variant={user.isActive ? 'active' : 'locked'}>
        {user.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    key: 'lastActive',
    header: 'Last Active',
    render: (user: User) => (
      <span className="text-muted-foreground">
        {user.lastActive?.toLocaleDateString()}
      </span>
    ),
  },
];

const courseColumns = [
  {
    key: 'title',
    header: 'Course',
    render: (course: Course) => (
      <div>
        <p className="font-medium text-foreground">{course.title}</p>
        <p className="text-xs text-muted-foreground">{course.totalLessons} lessons</p>
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
        {course.status}
      </Badge>
    ),
  },
  {
    key: 'price',
    header: 'Price',
    render: (course: Course) => (
      <span className="font-medium">${course.price || 0}</span>
    ),
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64">
        <AdminHeader title="Dashboard" subtitle="Overview of your therapy platform" />
        
        <main className="p-6">
          {/* Stats Grid */}
          <section className="grid grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              title="Total Users"
              value={dashboardStats.totalUsers.toLocaleString()}
              change="+12%"
              trend="up"
              style={{ animationDelay: '0ms' }}
            />
            <StatCard
              icon={Activity}
              title="Active Users"
              value={dashboardStats.activeUsers.toLocaleString()}
              change="+8%"
              trend="up"
              style={{ animationDelay: '100ms' }}
            />
            <StatCard
              icon={BookOpen}
              title="Total Courses"
              value={dashboardStats.totalCourses}
              change="+2"
              trend="up"
              style={{ animationDelay: '200ms' }}
            />
            <StatCard
              icon={DollarSign}
              title="Revenue"
              value={`$${(dashboardStats.revenue / 1000).toFixed(1)}k`}
              change="+23%"
              trend="up"
              style={{ animationDelay: '300ms' }}
            />
          </section>

          {/* Secondary Stats */}
          <section className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-soft animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold text-foreground">Completion Rate</h3>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="flex items-end gap-4">
                <span className="font-serif text-5xl font-bold text-foreground">{dashboardStats.completionRate}%</span>
                <span className="text-sm text-success mb-2">+5% from last month</span>
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                  style={{ width: `${dashboardStats.completionRate}%` }}
                />
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-soft animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold text-foreground">Active Alerts</h3>
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex items-end gap-4">
                <span className="font-serif text-5xl font-bold text-foreground">{dashboardStats.alerts}</span>
                <span className="text-sm text-muted-foreground mb-2">interruptions today</span>
              </div>
              <Button variant="warning" size="sm" className="mt-4">
                Review Alerts
              </Button>
            </div>
          </section>

          {/* Tables */}
          <div className="grid grid-cols-2 gap-6">
            <section className="animate-fade-in" style={{ animationDelay: '600ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold text-foreground">Recent Users</h3>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <DataTable columns={userColumns} data={mockUsers} />
            </section>

            <section className="animate-fade-in" style={{ animationDelay: '700ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold text-foreground">Courses</h3>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <DataTable columns={courseColumns} data={mockCourses} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
