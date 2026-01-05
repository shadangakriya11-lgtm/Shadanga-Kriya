import { FacilitatorSidebar } from '@/components/facilitator/FacilitatorSidebar';
import { FacilitatorHeader } from '@/components/facilitator/FacilitatorHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Users, CheckCircle, Clock, TrendingUp, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useFacilitatorAnalytics } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function FacilitatorReports() {
  const { user } = useAuth();
  const { data, isLoading } = useFacilitatorAnalytics();

  const hasPermission = user?.role === 'admin' || user?.permissions?.includes('analytics');

  const stats = [
    { label: 'Total Sessions', value: data?.total_sessions || 0, icon: Clock, change: data?.completed_sessions ? `${data.completed_sessions} done` : '0 done' },
    { label: 'Total Participants', value: data?.total_participants || 0, icon: Users, change: 'Lifetime' },
    { label: 'Upcoming', value: data?.upcoming_sessions || 0, icon: CheckCircle, change: 'Scheduled' },
    { label: 'Avg. Attendance', value: `${data?.avg_attendance_rate || 0}%`, icon: TrendingUp, change: 'Present' },
  ];

  const attendanceData = data?.weeklyAttendance || [];

  const completionData = (data?.completionStats || []).map((s: any) => ({
    name: s.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value: parseInt(s.count),
    color: s.status === 'completed' ? 'hsl(var(--success))' :
      s.status === 'in_progress' ? 'hsl(var(--primary))' :
        s.status === 'scheduled' ? 'hsl(var(--warning))' : 'hsl(var(--muted))'
  }));

  const recentSessions = data?.recentSessions || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <FacilitatorSidebar />
      </div>

      <div className="lg:ml-64">
        <FacilitatorHeader title="Reports" subtitle="View session and attendance reports" />

        {!hasPermission && !isLoading ? (
          <main className="p-4 lg:p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
              <ShieldAlert className="h-10 w-10 text-warning" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              You don't have permission to view analytics and reports.
              Please request permission from the administrator to access this feature.
            </p>
          </main>
        ) : (
          <main className="p-4 lg:p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p>Loading analytics...</p>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <Select defaultValue="week">
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={stat.label}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <span className="text-[10px] text-success font-medium uppercase tracking-tighter">{stat.change}</span>
                          </div>
                          <p className="text-2xl font-serif font-bold mt-2">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-serif text-lg">Weekly Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {attendanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar dataKey="present" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Present" />
                            <Bar dataKey="absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Absent" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                          No activity in the last 7 days
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="font-serif text-lg">Session Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {completionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={completionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {completionData.map((entry: any, index: number) => (
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
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                          No session data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Sessions Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Recent Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Participants</th>
                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {recentSessions.length > 0 ? (
                            recentSessions.map((session: any) => (
                              <tr key={session.id} className="hover:bg-muted/50 transition-colors">
                                <td className="p-4 text-sm text-muted-foreground">
                                  {new Date(session.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </td>
                                <td className="p-4 text-sm font-medium text-foreground">
                                  {session.course_title || session.title}
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4 opacity-50" />
                                    {session.participant_count}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <Badge variant={
                                    session.status === 'completed' ? 'completed' :
                                      session.status === 'in_progress' ? 'active' : 'outline'
                                  }>
                                    {session.status.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                No recent sessions found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

