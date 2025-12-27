import { FacilitatorSidebar } from '@/components/facilitator/FacilitatorSidebar';
import { FacilitatorHeader } from '@/components/facilitator/FacilitatorHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Play, CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const todaySessions = [
  {
    id: 's1',
    time: '09:00 AM',
    courseName: 'Mindful Breathing Basics',
    location: 'Room A',
    participants: 12,
    status: 'upcoming',
  },
  {
    id: 's2',
    time: '11:00 AM',
    courseName: 'Stress Response Protocol',
    location: 'Room B',
    participants: 8,
    status: 'in_progress',
  },
  {
    id: 's3',
    time: '02:00 PM',
    courseName: 'Guided Recovery Session',
    location: 'Room A',
    participants: 15,
    status: 'upcoming',
  },
];

const quickStats = [
  { label: "Today's Sessions", value: '3', icon: Play, color: 'text-primary' },
  { label: 'Total Attendees', value: '35', icon: Users, color: 'text-secondary-foreground' },
  { label: 'Completed', value: '1', icon: CheckCircle, color: 'text-success' },
  { label: 'Pending', value: '2', icon: Clock, color: 'text-warning' },
];

export default function FacilitatorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <FacilitatorSidebar />
      </div>
      
      <div className="lg:ml-64">
        <FacilitatorHeader title="Dashboard" subtitle="Welcome back, Dr. Watson" />
        
        <main className="p-4 lg:p-6">
          {/* Quick Stats - Responsive grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6">
            <Button 
              variant="premium" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/facilitator/attendance')}
            >
              <Users className="h-6 w-6" />
              <span>Mark Attendance</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/facilitator/sessions')}
            >
              <Play className="h-6 w-6" />
              <span>Start Session</span>
            </Button>
          </div>

          {/* Today's Sessions */}
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg font-semibold">Today's Sessions</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/facilitator/sessions')}>
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {todaySessions.map((session) => (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/facilitator/sessions')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-semibold text-foreground">{session.time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{session.courseName}</p>
                        <p className="text-sm text-muted-foreground">{session.location} • {session.participants} participants</p>
                      </div>
                    </div>
                    <Badge variant={session.status === 'in_progress' ? 'active' : 'pending'}>
                      {session.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="mt-4 lg:mt-6 border-warning/50">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">Attention Required</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    2 participants from the 11:00 AM session exceeded their pause limits. Review their progress in the Sessions tab.
                  </p>
                  <Button variant="warning" size="sm" className="mt-3">
                    Review Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
