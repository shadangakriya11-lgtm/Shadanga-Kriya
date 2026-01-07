import { useState, useEffect } from "react";
import { FacilitatorSidebar } from "@/components/facilitator/FacilitatorSidebar";
import { FacilitatorHeader } from "@/components/facilitator/FacilitatorHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Loader2,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import {
  useMySessions,
  useSessionAttendance,
  useMarkAttendance,
} from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert } from "lucide-react";

export default function FacilitatorAttendance() {
  const { user } = useAuth();
  const { toast: showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const hasPermission =
    user?.role === "admin" || user?.permissions?.includes("course_view");

  const { data: sessionsData, isLoading: sessionsLoading } = useMySessions();
  const sessions = sessionsData?.sessions || [];

  // Auto-select first upcoming or in-progress session if none selected
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const activeSession = sessions.find((s: any) => s.status !== "completed");
      if (activeSession) setSelectedSessionId(activeSession.id);
      else setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const { data: attendanceData, isLoading: attendanceLoading } =
    useSessionAttendance(selectedSessionId);
  const markAttendanceMutation = useMarkAttendance();

  const attendees = attendanceData?.attendance || [];
  const selectedSession = sessions.find((s: any) => s.id === selectedSessionId);

  const filteredAttendees = attendees.filter((attendee: any) => {
    const name = `${attendee.first_name} ${attendee.last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const handleMark = (userId: string, status: "present" | "absent") => {
    markAttendanceMutation.mutate({
      sessionId: selectedSessionId,
      userId,
      status,
    });
  };

  // Export attendance to CSV
  const exportToCSV = () => {
    if (!selectedSessionId || attendees.length === 0) {
      showToast({
        title: "Export Failed",
        description: "No attendance data to export",
        variant: "destructive",
      });
      return;
    }

    const sessionInfo = selectedSession || {};
    const headers = ["Name", "Email", "Status", "Marked At"];
    const csvData = attendees.map((a: any) => [
      `${a.first_name} ${a.last_name}`,
      a.email,
      a.status || "pending",
      a.marked_at ? new Date(a.marked_at).toLocaleString() : "Not marked",
    ]);

    const csvContent = [
      `# Attendance Report`,
      `# Session: ${
        sessionInfo.course_title || sessionInfo.title || "Unknown Session"
      }`,
      `# Date: ${
        sessionInfo.scheduledAt
          ? new Date(sessionInfo.scheduledAt).toLocaleDateString()
          : "Unknown Date"
      }`,
      `# Total: ${attendees.length}, Present: ${presentCount}, Absent: ${absentCount}, Pending: ${pendingCount}`,
      "",
      headers.join(","),
      ...csvData.map((row: string[]) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_${selectedSessionId}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    showToast({
      title: "Export Complete",
      description: `Exported ${attendees.length} attendance records`,
    });
  };

  const presentCount = attendees.filter(
    (a: any) => a.status === "present"
  ).length;
  const absentCount = attendees.filter(
    (a: any) => a.status === "absent"
  ).length;
  const pendingCount = attendees.filter(
    (a: any) => !a.status || a.status === "pending"
  ).length;

  if (!hasPermission && !sessionsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <FacilitatorSidebar />
        <div className="lg:ml-64">
          <FacilitatorHeader
            title="Attendance"
            subtitle="Mark and manage session attendance"
          />
          <main className="p-4 lg:p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
              <ShieldAlert className="h-10 w-10 text-warning" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-2">
              Access Restricted
            </h2>
            <p className="text-muted-foreground max-w-md mb-8">
              You don't have permission to manage attendance. Please request
              permission from the administrator to access this feature.
            </p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <FacilitatorSidebar />
      </div>

      <div className="lg:ml-64">
        <FacilitatorHeader
          title="Attendance"
          subtitle="Mark and manage session attendance"
        />

        <main className="p-4 lg:p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-serif font-bold text-success">
                    {attendanceLoading ? "..." : presentCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-serif font-bold text-destructive">
                    {attendanceLoading ? "..." : absentCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-2xl font-serif font-bold text-warning">
                    {attendanceLoading ? "..." : pendingCount}
                  </p>
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
            <Select
              value={selectedSessionId}
              onValueChange={setSelectedSessionId}
            >
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessionsLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Loading sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No sessions found
                  </div>
                ) : (
                  sessions.map((session: any) => (
                    <SelectItem key={session.id} value={session.id}>
                      {new Date(session.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      - {session.course_title || session.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={
                !selectedSessionId ||
                attendanceLoading ||
                attendees.length === 0
              }
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Attendee List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg">Attendees</CardTitle>
                {markAttendanceMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {attendanceLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Loading attendance list...</p>
                </div>
              ) : filteredAttendees.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredAttendees.map((attendee: any) => (
                    <div
                      key={attendee.user_id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                          {attendee.first_name?.[0]}
                          {attendee.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {attendee.first_name} {attendee.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {attendee.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {attendee.marked_at && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {new Date(attendee.marked_at).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        )}
                        <div className="flex gap-1">
                          <Button
                            variant={
                              attendee.status === "present"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={
                              attendee.status === "present"
                                ? "bg-success hover:bg-success/90"
                                : ""
                            }
                            onClick={() =>
                              handleMark(attendee.user_id, "present")
                            }
                            disabled={markAttendanceMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              attendee.status === "absent"
                                ? "destructive"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              handleMark(attendee.user_id, "absent")
                            }
                            disabled={markAttendanceMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>
                    {selectedSessionId
                      ? "No attendees found for this session."
                      : "Please select a session to view attendees."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
