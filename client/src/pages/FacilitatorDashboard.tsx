import { FacilitatorSidebar } from '@/components/facilitator/FacilitatorSidebar';
import { FacilitatorHeader } from '@/components/facilitator/FacilitatorHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Play, CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMySessions, useFacilitatorAnalytics } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';

export default function FacilitatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: sessionsData, isLoading: sessionsLoading } = useMySessions();
  const { data: analyticsData, isLoading: analyticsLoading } = useFacilitatorAnalytics();

  const hasAnalyticsPermission = user?.role === 'admin' || user?.permissions?.includes('analytics');
  const hasCoursePermission = user?.role === 'admin' || user?.permissions?.includes('course_view');

  const isLoading = sessionsLoading || analyticsLoading;
  const sessions = sessionsData?.sessions || [];
  const stats = analyticsData || {};

  const todaySessions = sessions.filter((s: any) => {
    const sessionDate = new Date(s.scheduledAt);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  });

  const quickStats = [
    { label: "Today's Sessions", value: todaySessions.length.toString(), icon: Play, color: 'text-primary' },
    { label: 'Total Participants', value: stats.total_participants?.toString() || '0', icon: Users, color: 'text-secondary-foreground' },
    { label: 'Completed', value: stats.completed_sessions?.toString() || '0', icon: CheckCircle, color: 'text-success' },
    { label: 'Upcoming', value: stats.upcoming_sessions?.toString() || '0', icon: Clock, color: 'text-warning' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="hidden lg:block"><FacilitatorSidebar /></div>
        <div className="lg:ml-64">
          <FacilitatorHeader title="Dashboard" subtitle={`Welcome back, ${user?.firstName || 'Facilitator'}`} />
          <main className="p-4 lg:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block"><FacilitatorSidebar /></div>
      <div className="lg:ml-64">
        <FacilitatorHeader title="Dashboard" subtitle={`Welcome back, ${user?.firstName || 'Facilitator'}`} />
        <main className="p-4 lg:p-6">
          {hasAnalyticsPermission ? (
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
          ) : (
            <Card className="mb-6 bg-muted/30">
              <CardContent className="p-4 py-8 text-center text-muted-foreground">
                <p>General analytics are restricted. Contact admin for permission.</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6">
            <Button variant="premium" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/facilitator/attendance')} disabled={!hasCoursePermission}>
              <Users className="h-6 w-6" /><span>Mark Attendance</span>
              {!hasCoursePermission && <span className="text-[10px] opacity-70">(Needs Permission)</span>}
            </Button>
            <Button variant="secondary" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/facilitator/sessions')} disabled={!hasCoursePermission}>
              <Play className="h-6 w-6" /><span>Start Session</span>
              {!hasCoursePermission && <span className="text-[10px] opacity-70">(Needs Permission)</span>}
            </Button>
          </div>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg font-semibold">Today's Sessions</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/facilitator/sessions')}>
                  View All<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {hasCoursePermission ? (
                  todaySessions.length > 0 ? todaySessions.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/facilitator/sessions')}>
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-sm font-semibold text-foreground">
                            {new Date(session.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{session.course_title || session.title}</p>
                          <p className="text-sm text-muted-foreground">{session.location} • {session.participant_count || 0} participants</p>
                        </div>
                      </div>
                      <Badge variant={session.status === 'in_progress' ? 'active' : 'pending'}>
                        {session.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                      </Badge>
                    </div>
                  )) : (
                    <p className="text-center text-muted-foreground py-8">No sessions scheduled for today</p>
                  )
                ) : (
                  <p className="text-center text-muted-foreground py-8">Session viewing is restricted. Contact admin for permission.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
