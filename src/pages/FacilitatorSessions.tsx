import { useState } from 'react';
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
import { Play, Pause, StopCircle, Users, Clock, AlertTriangle, CheckCircle, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  time: string;
  courseName: string;
  lessonName: string;
  location: string;
  participants: number;
  duration: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'paused';
}

interface Participant {
  id: string;
  name: string;
  progress: number;
  pausesUsed: number;
  maxPauses: number;
  status: 'listening' | 'paused' | 'completed' | 'interrupted';
}

const mockSessions: Session[] = [
  { id: 's1', time: '09:00 AM', courseName: 'Mindful Breathing', lessonName: 'Introduction to Breathing', location: 'Room A', participants: 12, duration: 25, status: 'completed' },
  { id: 's2', time: '11:00 AM', courseName: 'Stress Response', lessonName: 'Understanding Stress', location: 'Room B', participants: 8, duration: 30, status: 'in_progress' },
  { id: 's3', time: '02:00 PM', courseName: 'Guided Recovery', lessonName: 'Session 1: Foundation', location: 'Room A', participants: 15, duration: 45, status: 'upcoming' },
];

const mockParticipants: Participant[] = [
  { id: 'p1', name: 'Sarah Mitchell', progress: 78, pausesUsed: 1, maxPauses: 3, status: 'listening' },
  { id: 'p2', name: 'James Chen', progress: 72, pausesUsed: 0, maxPauses: 3, status: 'listening' },
  { id: 'p3', name: 'Emily Johnson', progress: 45, pausesUsed: 2, maxPauses: 3, status: 'paused' },
  { id: 'p4', name: 'Michael Brown', progress: 65, pausesUsed: 3, maxPauses: 3, status: 'interrupted' },
  { id: 'p5', name: 'Lisa Wang', progress: 80, pausesUsed: 1, maxPauses: 3, status: 'listening' },
];

export default function FacilitatorSessions() {
  const [sessions, setSessions] = useState(mockSessions);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);

  const startSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, status: 'in_progress' as const } : s
    ));
    toast.success('Session started!');
  };

  const pauseSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, status: 'paused' as const } : s
    ));
    toast.info('Session paused');
  };

  const endSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, status: 'completed' as const } : s
    ));
    setIsMonitorOpen(false);
    toast.success('Session completed!');
  };

  const openMonitor = (session: Session) => {
    setSelectedSession(session);
    setIsMonitorOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'listening': return 'text-success';
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
        <FacilitatorHeader title="Sessions" subtitle="Start and supervise therapy sessions" />
        
        <main className="p-4 lg:p-6">
          {/* Session Cards */}
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className={session.status === 'in_progress' ? 'border-primary' : ''}>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Volume2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-serif font-semibold text-foreground">{session.courseName}</h3>
                          <Badge variant={
                            session.status === 'completed' ? 'completed' :
                            session.status === 'in_progress' ? 'active' :
                            session.status === 'paused' ? 'pending' : 'outline'
                          }>
                            {session.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{session.lessonName}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {session.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {session.participants}
                          </span>
                          <span>{session.location}</span>
                          <span>{session.duration} min</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {session.status === 'upcoming' && (
                        <Button variant="premium" onClick={() => startSession(session.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Start Session
                        </Button>
                      )}
                      {session.status === 'in_progress' && (
                        <>
                          <Button variant="outline" onClick={() => openMonitor(session)}>
                            <Users className="h-4 w-4 mr-2" />
                            Monitor
                          </Button>
                          <Button variant="warning" onClick={() => pauseSession(session.id)}>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                          <Button variant="destructive" onClick={() => endSession(session.id)}>
                            <StopCircle className="h-4 w-4 mr-2" />
                            End
                          </Button>
                        </>
                      )}
                      {session.status === 'paused' && (
                        <>
                          <Button variant="premium" onClick={() => startSession(session.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </Button>
                          <Button variant="destructive" onClick={() => endSession(session.id)}>
                            <StopCircle className="h-4 w-4 mr-2" />
                            End
                          </Button>
                        </>
                      )}
                      {session.status === 'completed' && (
                        <Badge variant="completed" className="px-4 py-2">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monitor Dialog */}
          <Dialog open={isMonitorOpen} onOpenChange={setIsMonitorOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">
                  Live Session Monitor - {selectedSession?.courseName}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Session Progress */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </CardContent>
                </Card>

                {/* Participant List */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Participants</h4>
                  {mockParticipants.map((participant) => (
                    <Card key={participant.id} className={participant.status === 'interrupted' ? 'border-destructive/50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{participant.name}</p>
                              <p className={`text-xs ${getStatusColor(participant.status)}`}>
                                {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">{participant.progress}%</p>
                              <p className="text-xs text-muted-foreground">
                                Pauses: {participant.pausesUsed}/{participant.maxPauses}
                              </p>
                            </div>
                            {participant.status === 'interrupted' && (
                              <Button variant="warning" size="sm">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Assist
                              </Button>
                            )}
                          </div>
                        </div>
                        <Progress value={participant.progress} className="h-1 mt-3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
