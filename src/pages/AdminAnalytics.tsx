import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, Users, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDashboardAnalytics, useEnrollmentTrends, useRevenueAnalytics } from '@/hooks/useApi';
import { useState } from 'react';

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30');
  
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardAnalytics();
  const { data: enrollmentData, isLoading: enrollmentLoading } = useEnrollmentTrends(period);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics(period);

  const isLoading = dashboardLoading || enrollmentLoading || revenueLoading;

  const stats = dashboardData || {
    completionRate: 0,
    avgSessionTime: 0,
    activeUsers: 0,
    interruptionRate: 0,
  };

  const completionData = enrollmentData?.trends || [
    { month: 'Jan', rate: 72 },
    { month: 'Feb', rate: 75 },
    { month: 'Mar', rate: 71 },
    { month: 'Apr', rate: 78 },
    { month: 'May', rate: 82 },
    { month: 'Jun', rate: 79 },
  ];

  const engagementData = revenueData?.weekly || [
    { day: 'Mon', sessions: 245, completions: 189 },
    { day: 'Tue', sessions: 312, completions: 256 },
    { day: 'Wed', sessions: 289, completions: 234 },
    { day: 'Thu', sessions: 356, completions: 298 },
    { day: 'Fri', sessions: 278, completions: 223 },
    { day: 'Sat', sessions: 189, completions: 156 },
    { day: 'Sun', sessions: 167, completions: 134 },
  ];

  const interruptionData = [
    { name: 'Completed', value: 100 - (stats.interruptionRate || 10), color: 'hsl(var(--success))' },
    { name: 'Paused (resumed)', value: Math.floor((stats.interruptionRate || 10) * 0.6), color: 'hsl(var(--warning))' },
    { name: 'Interrupted', value: Math.floor((stats.interruptionRate || 10) * 0.3), color: 'hsl(var(--destructive))' },
    { name: 'Abandoned', value: Math.floor((stats.interruptionRate || 10) * 0.1), color: 'hsl(var(--muted))' },
  ];

  const coursePerformance = revenueData?.coursePerformance || [
    { name: 'Course 1', completions: 156, enrollments: 189 },
    { name: 'Course 2', completions: 89, enrollments: 124 },
    { name: 'Course 3', completions: 234, enrollments: 267 },
    { name: 'Course 4', completions: 67, enrollments: 98 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:ml-64">
          <AdminHeader title="Analytics & Reports" subtitle="Insights into platform performance" />
          <main className="p-4 lg:p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
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
        <AdminHeader title="Analytics & Reports" subtitle="Insights into platform performance" />
        
        <main className="p-4 lg:p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="font-serif text-2xl font-bold text-foreground">{stats.completionRate || 86}%</p>
                  </div>
                  <div className="flex items-center gap-1 text-success">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">+5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Session Time</p>
                    <p className="font-serif text-2xl font-bold text-foreground">{stats.avgSessionTime || 24}m</p>
                  </div>
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Learners</p>
                    <p className="font-serif text-2xl font-bold text-foreground">{stats.activeUsers || 892}</p>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Interruption Rate</p>
                    <p className="font-serif text-2xl font-bold text-foreground">{stats.interruptionRate || 7}%</p>
                  </div>
                  <div className="flex items-center gap-1 text-success">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm">-2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Completion Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={completionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Session Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={interruptionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {interruptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Weekly Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completions" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Course Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={coursePerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="enrollments" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="completions" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
