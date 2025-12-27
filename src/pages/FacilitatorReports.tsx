import { FacilitatorSidebar } from '@/components/facilitator/FacilitatorSidebar';
import { FacilitatorHeader } from '@/components/facilitator/FacilitatorHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';
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

const attendanceData = [
  { day: 'Mon', present: 45, absent: 5 },
  { day: 'Tue', present: 48, absent: 2 },
  { day: 'Wed', present: 42, absent: 8 },
  { day: 'Thu', present: 50, absent: 0 },
  { day: 'Fri', present: 47, absent: 3 },
];

const completionData = [
  { name: 'Completed', value: 78, color: 'hsl(var(--success))' },
  { name: 'In Progress', value: 15, color: 'hsl(var(--primary))' },
  { name: 'Not Started', value: 7, color: 'hsl(var(--muted))' },
];

const sessionStats = [
  { label: 'Sessions This Week', value: '12', icon: Clock, change: '+2' },
  { label: 'Total Participants', value: '156', icon: Users, change: '+18' },
  { label: 'Completion Rate', value: '87%', icon: CheckCircle, change: '+5%' },
  { label: 'Avg. Attendance', value: '94%', icon: TrendingUp, change: '+3%' },
];

const recentSessions = [
  { id: 1, date: 'Dec 27', course: 'Mindful Breathing', participants: 12, completion: 100 },
  { id: 2, date: 'Dec 27', course: 'Stress Response', participants: 8, completion: 85 },
  { id: 3, date: 'Dec 26', course: 'Guided Recovery', participants: 15, completion: 92 },
  { id: 4, date: 'Dec 26', course: 'Mindful Breathing', participants: 10, completion: 100 },
  { id: 5, date: 'Dec 25', course: 'Sleep Restoration', participants: 14, completion: 78 },
];

export default function FacilitatorReports() {
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <FacilitatorSidebar />
      </div>
      
      <div className="lg:ml-64">
        <FacilitatorHeader title="Reports" subtitle="View session and attendance reports" />
        
        <main className="p-4 lg:p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <Select defaultValue="week">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            {sessionStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-success font-medium">{stat.change}</span>
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
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={attendanceData}>
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
                    <Bar dataKey="present" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Present" />
                    <Bar dataKey="absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Course Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {completionData.map((entry, index) => (
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

          {/* Recent Sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Course</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Participants</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((session) => (
                      <tr key={session.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-4 text-sm text-muted-foreground">{session.date}</td>
                        <td className="p-4 text-sm font-medium text-foreground">{session.course}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {session.participants}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-success rounded-full"
                                style={{ width: `${session.completion}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{session.completion}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
