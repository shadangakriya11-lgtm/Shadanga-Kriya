import { useState } from 'react';
import { FacilitatorSidebar } from '@/components/facilitator/FacilitatorSidebar';
import { FacilitatorHeader } from '@/components/facilitator/FacilitatorHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Users, CheckCircle, XCircle, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Attendee {
  id: string;
  name: string;
  email: string;
  courseName: string;
  sessionTime: string;
  isPresent: boolean | null;
  arrivalTime?: string;
}

const mockAttendees: Attendee[] = [
  { id: 'a1', name: 'Sarah Mitchell', email: 'sarah.m@example.com', courseName: 'Mindful Breathing', sessionTime: '09:00 AM', isPresent: true, arrivalTime: '08:55 AM' },
  { id: 'a2', name: 'James Chen', email: 'james.c@example.com', courseName: 'Mindful Breathing', sessionTime: '09:00 AM', isPresent: true, arrivalTime: '09:02 AM' },
  { id: 'a3', name: 'Emily Johnson', email: 'emily.j@example.com', courseName: 'Mindful Breathing', sessionTime: '09:00 AM', isPresent: false },
  { id: 'a4', name: 'Michael Brown', email: 'michael.b@example.com', courseName: 'Mindful Breathing', sessionTime: '09:00 AM', isPresent: null },
  { id: 'a5', name: 'Lisa Wang', email: 'lisa.w@example.com', courseName: 'Stress Response', sessionTime: '11:00 AM', isPresent: null },
  { id: 'a6', name: 'David Kim', email: 'david.k@example.com', courseName: 'Stress Response', sessionTime: '11:00 AM', isPresent: null },
  { id: 'a7', name: 'Anna Lee', email: 'anna.l@example.com', courseName: 'Stress Response', sessionTime: '11:00 AM', isPresent: null },
  { id: 'a8', name: 'Robert Taylor', email: 'robert.t@example.com', courseName: 'Guided Recovery', sessionTime: '02:00 PM', isPresent: null },
];

const sessions = [
  { id: 'all', label: 'All Sessions' },
  { id: 's1', label: '09:00 AM - Mindful Breathing' },
  { id: 's2', label: '11:00 AM - Stress Response' },
  { id: 's3', label: '02:00 PM - Guided Recovery' },
];

export default function FacilitatorAttendance() {
  const [attendees, setAttendees] = useState(mockAttendees);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState('all');

  const filteredAttendees = attendees.filter((attendee) => {
    const matchesSearch = attendee.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSession = selectedSession === 'all' || 
      (selectedSession === 's1' && attendee.sessionTime === '09:00 AM') ||
      (selectedSession === 's2' && attendee.sessionTime === '11:00 AM') ||
      (selectedSession === 's3' && attendee.sessionTime === '02:00 PM');
    return matchesSearch && matchesSession;
  });

  const markAttendance = (id: string, isPresent: boolean) => {
    setAttendees(prev => prev.map(a => 
      a.id === id 
        ? { ...a, isPresent, arrivalTime: isPresent ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined }
        : a
    ));
  };

  const saveAttendance = () => {
    toast.success('Attendance saved successfully!');
  };

  const presentCount = filteredAttendees.filter(a => a.isPresent === true).length;
  const absentCount = filteredAttendees.filter(a => a.isPresent === false).length;
  const pendingCount = filteredAttendees.filter(a => a.isPresent === null).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <FacilitatorSidebar />
      </div>
      
      <div className="lg:ml-64">
        <FacilitatorHeader title="Attendance" subtitle="Mark and manage session attendance" />
        
        <main className="p-4 lg:p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-serif font-bold text-success">{presentCount}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-serif font-bold text-destructive">{absentCount}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-2xl font-serif font-bold text-warning">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Attendee List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg">Attendees</CardTitle>
                <Button variant="premium" size="sm" onClick={saveAttendance}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredAttendees.map((attendee) => (
                  <div 
                    key={attendee.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                        {attendee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{attendee.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{attendee.courseName} • {attendee.sessionTime}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {attendee.arrivalTime && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {attendee.arrivalTime}
                        </span>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant={attendee.isPresent === true ? 'default' : 'outline'}
                          size="sm"
                          className={attendee.isPresent === true ? 'bg-success hover:bg-success/90' : ''}
                          onClick={() => markAttendance(attendee.id, true)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={attendee.isPresent === false ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => markAttendance(attendee.id, false)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
