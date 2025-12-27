import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

const completionData = [
  { month: 'Jan', rate: 72 },
  { month: 'Feb', rate: 75 },
  { month: 'Mar', rate: 71 },
  { month: 'Apr', rate: 78 },
  { month: 'May', rate: 82 },
  { month: 'Jun', rate: 79 },
  { month: 'Jul', rate: 85 },
  { month: 'Aug', rate: 83 },
  { month: 'Sep', rate: 87 },
  { month: 'Oct', rate: 84 },
  { month: 'Nov', rate: 88 },
  { month: 'Dec', rate: 86 },
];

const engagementData = [
  { day: 'Mon', sessions: 245, completions: 189 },
  { day: 'Tue', sessions: 312, completions: 256 },
  { day: 'Wed', sessions: 289, completions: 234 },
  { day: 'Thu', sessions: 356, completions: 298 },
  { day: 'Fri', sessions: 278, completions: 223 },
  { day: 'Sat', sessions: 189, completions: 156 },
  { day: 'Sun', sessions: 167, completions: 134 },
];

const interruptionData = [
  { name: 'Completed', value: 78, color: 'hsl(var(--success))' },
  { name: 'Paused (resumed)', value: 12, color: 'hsl(var(--warning))' },
  { name: 'Interrupted', value: 7, color: 'hsl(var(--destructive))' },
  { name: 'Abandoned', value: 3, color: 'hsl(var(--muted))' },
];

const coursePerformance = [
  { name: 'Mindful Breathing', completions: 156, enrollments: 189 },
  { name: 'Stress Response', completions: 89, enrollments: 124 },
  { name: 'Sleep Restoration', completions: 234, enrollments: 267 },
  { name: 'Guided Recovery', completions: 67, enrollments: 98 },
];

export default function AdminAnalytics() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64">
        <AdminHeader title="Analytics & Reports" subtitle="Insights into platform performance" />
        
        <main className="p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Select defaultValue="30">
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
                    <p className="font-serif text-2xl font-bold text-foreground">86%</p>
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
                    <p className="font-serif text-2xl font-bold text-foreground">24m</p>
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
                    <p className="font-serif text-2xl font-bold text-foreground">892</p>
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
                    <p className="font-serif text-2xl font-bold text-foreground">7%</p>
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
