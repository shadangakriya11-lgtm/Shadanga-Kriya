import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FacilitatorSidebar } from '@/components/facilitator/FacilitatorSidebar';
import { FacilitatorHeader } from '@/components/facilitator/FacilitatorHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Play, Pause, StopCircle, Users, Clock, AlertTriangle, CheckCircle, Volume2, Loader2, ArrowRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useMySessions, useStartSession, useEndSession, useUpdateSession, useMonitoringStats, useCourses, useCreateSession } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function FacilitatorSessions() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const filterCourseId = searchParams.get('courseId');
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const hasPermission = user?.role === 'admin' || user?.permissions?.includes('course_view');

  const { data: sessionsData, isLoading: sessionsLoading } = useMySessions();
  const sessions = useMemo(() => {
    let list = sessionsData?.sessions || [];
    if (filterCourseId) {
      list = list.filter((s: any) => s.courseId === filterCourseId);
    }
    return list;
  }, [sessionsData, filterCourseId]);

  const startMutation = useStartSession();
  const endMutation = useEndSession();
  const updateMutation = useUpdateSession();
  const { data: monitoringData } = useMonitoringStats();
  const { data: coursesData } = useCourses();
  const createSessionMutation = useCreateSession();

  const handleQuickStart = () => {
    if (!filterCourseId) return;

    const course = coursesData?.courses?.find((c: any) => c.id === filterCourseId);
    const title = course ? `${course.title} Live Session` : "Live Session";

    setIsCreatingSession(true);
    createSessionMutation.mutate({
      courseId: filterCourseId,
      title: title,
      scheduledAt: new Date().toISOString(),
      status: 'scheduled'
    }, {
      onSuccess: (data: any) => {
        handleStart(data.session.id);
        setIsCreatingSession(false);
      },
      onError: () => setIsCreatingSession(false)
    });
  };

  const handleStart = (id: string) => {
    startMutation.mutate(id);
  };

  const handlePause = (id: string) => {
    updateMutation.mutate({ id, data: { status: 'paused' } });
  };

  const handleResume = (id: string) => {
    updateMutation.mutate({ id, data: { status: 'in_progress' } });
  };

  const handleEnd = (id: string) => {
    endMutation.mutate(id, {
      onSuccess: () => {
        setIsMonitorOpen(false);
      }
    });
  };

  const openMonitor = (session: any) => {
    setSelectedSession(session);
    setIsMonitorOpen(true);
  };

  // Filter monitoring data for users enrolled in this course (as a proxy for this session)
  // Ideally, monitoring data should be linkable to a session. 
  // For now, we'll show users active in the same course.
  const sessionParticipants = monitoringData?.monitoring?.filter((m: any) =>
    m.courseTitle === (selectedSession?.course_title || selectedSession?.title)
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-success';
      case 'paused': return 'text-warning';
      case 'completed': return 'text-primary';
      case 'interrupted': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <FacilitatorSidebar />
      </div>

      <div className="lg:ml-64">
        <FacilitatorHeader
          title="Sessions"
          subtitle="Start and supervise therapy sessions"
          action={filterCourseId ? (
            <Button onClick={handleQuickStart} disabled={isCreatingSession} size="sm">
              {isCreatingSession ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Create New Session
            </Button>
          ) : undefined}
        />

        {!hasPermission && !sessionsLoading ? (
          <main className="p-4 lg:p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
              <ShieldAlert className="h-10 w-10 text-warning" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              You don't have permission to manage sessions.
              Please request permission from the administrator to access this feature.
            </p>
          </main>
        ) : (
          <main className="p-4 lg:p-6">
            {sessionsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p>Loading sessions...</p>
              </div>
            ) : sessions.length === 0 && !sessionsLoading ? (
              <Card className="border-dashed">
                <CardContent className="py-20 text-center">
                  <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No sessions found</h3>
                  {filterCourseId ? (
                    <div className="mt-6 flex flex-col items-center gap-4">
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        There are no sessions scheduled for this course yet.
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                      You don't have any sessions assigned to you yet. Contact the administrator if this is a mistake.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sessions.map((session: any) => (
                  <Card key={session.id} className={session.status === 'in_progress' ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'shadow-sm'}>
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                            session.status === 'in_progress' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <Volume2 className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-serif font-semibold text-foreground text-lg">{session.course_title || session.title}</h3>
                              <Badge variant={
                                session.status === 'completed' ? 'completed' :
                                  session.status === 'in_progress' ? 'active' :
                                    session.status === 'paused' ? 'pending' : 'outline'
                              }>
                                {session.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{session.title}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(session.scheduledAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {session.participantCount} / {session.max_participants}
                              </span>
                              <span>{session.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {session.status === 'scheduled' && (
                            <Button variant="premium" onClick={() => handleStart(session.id)} disabled={startMutation.isPending}>
                              {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                              Start Session
                            </Button>
                          )}
                          {session.status === 'in_progress' && (
                            <>
                              <Button variant="outline" onClick={() => openMonitor(session)}>
                                <Users className="h-4 w-4 mr-2" />
                                Monitor
                              </Button>
                              <Button variant="warning" onClick={() => handlePause(session.id)} disabled={updateMutation.isPending}>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </Button>
                              <Button variant="destructive" onClick={() => handleEnd(session.id)} disabled={endMutation.isPending}>
                                <StopCircle className="h-4 w-4 mr-2" />
                                End
                              </Button>
                            </>
                          )}
                          {session.status === 'paused' && (
                            <>
                              <Button variant="premium" onClick={() => handleResume(session.id)} disabled={updateMutation.isPending}>
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </Button>
                              <Button variant="destructive" onClick={() => handleEnd(session.id)} disabled={endMutation.isPending}>
                                <StopCircle className="h-4 w-4 mr-2" />
                                End
                              </Button>
                            </>
                          )}
                          {session.status === 'completed' && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full font-medium">
                              <CheckCircle className="h-4 w-4" />
                              Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Monitor Dialog */}
            <Dialog open={isMonitorOpen} onOpenChange={setIsMonitorOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center justify-between pr-8">
                    <DialogTitle className="font-serif text-2xl">
                      Live Monitor
                    </DialogTitle>
                    <Badge variant="active" className="pulse">Live Updates Enabled</Badge>
                  </div>
                  <p className="text-muted-foreground">{selectedSession?.course_title || selectedSession?.title}</p>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Overall Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">{sessionParticipants.length}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Users</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">
                          {sessionParticipants.filter((m: any) => m.status === 'completed').length}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Finished</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-destructive">
                          {sessionParticipants.filter((m: any) => m.status === 'interrupted').length}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Help Needed</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Participant List */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground border-b pb-2">Individual Progress</h4>
                    {sessionParticipants.length > 0 ? (
                      sessionParticipants.map((participant: any) => (
                        <Card key={participant.id} className={cn(
                          "transition-all",
                          participant.status === 'interrupted' ? 'border-destructive ring-1 ring-destructive/20 bg-destructive/5' : ''
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                  {participant.userName.split(' ').map((n: any) => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{participant.userName}</p>
                                  <p className={`text-xs font-medium ${getStatusColor(participant.status)}`}>
                                    {participant.status.replace('_', ' ').charAt(0).toUpperCase() + participant.status.replace('_', ' ').slice(1)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-sm font-bold">{participant.progress}%</p>
                                  <p className="text-[10px] text-muted-foreground uppercase">
                                    Pauses: {participant.pausesUsed} / {participant.maxPauses}
                                  </p>
                                </div>
                                {participant.status === 'interrupted' && (
                                  <Badge variant="destructive" className="animate-pulse">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Check User
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Progress
                              value={participant.progress}
                              className={cn(
                                "h-1.5",
                                participant.status === 'interrupted' ? "[&>div]:bg-destructive" : ""
                              )}
                            />
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-10 border-2 border-dashed rounded-xl">
                        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-muted-foreground">No users currently active in this lesson.</p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </main>
        )}
      </div>
    </div>
  );
}
