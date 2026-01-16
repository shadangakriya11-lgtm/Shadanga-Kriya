import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Lock,
  Pause,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useMonitoringStats } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { progressApi } from "@/lib/api";

interface UserLessonProgress {
  id: string;
  lessonProgressId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  progress: number;
  pausesUsed: number;
  maxPauses: number;
  status: "in_progress" | "completed" | "paused" | "interrupted";
  lastActivity: Date | string;
}

interface MonitoringStats {
  activeSessions: number;
  completedToday: number;
  interrupted: number;
  pauseRequests: number;
}

interface MonitoringResponse {
  monitoring: UserLessonProgress[];
  stats: MonitoringStats;
}

interface ActionHandlers {
  onGrantPause: (item: UserLessonProgress) => void;
  onResetLesson: (item: UserLessonProgress) => void;
  onLockLesson: (item: UserLessonProgress) => void;
}

const getProgressColumns = (handlers: ActionHandlers) => [
  {
    key: "user",
    header: "User",
    render: (item: UserLessonProgress) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
          {(item.userName || "U")
            .split(" ")
            .map((n: string) => n[0])
            .join("")}
        </div>
        <div>
          <p className="font-medium text-foreground">{item.userName}</p>
          <p className="text-sm text-muted-foreground">{item.userEmail}</p>
        </div>
      </div>
    ),
  },
  {
    key: "lesson",
    header: "Lesson",
    render: (item: UserLessonProgress) => (
      <div>
        <p className="font-medium text-foreground">{item.lessonTitle}</p>
        <p className="text-sm text-muted-foreground">{item.courseTitle}</p>
      </div>
    ),
  },
  {
    key: "progress",
    header: "Progress",
    render: (item: UserLessonProgress) => (
      <div className="w-32">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{item.progress}%</span>
        </div>
        <Progress value={item.progress} className="h-2" />
      </div>
    ),
  },
  {
    key: "pauses",
    header: "Pauses",
    render: (item: UserLessonProgress) => (
      <div className="flex items-center gap-2">
        <Pause className="h-4 w-4 text-muted-foreground" />
        <span
          className={
            item.pausesUsed >= item.maxPauses
              ? "text-destructive font-medium"
              : "text-muted-foreground"
          }
        >
          {item.pausesUsed} / {item.maxPauses}
        </span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (item: UserLessonProgress) => {
      const variants: Record<
        string,
        "active" | "completed" | "pending" | "locked"
      > = {
        in_progress: "active",
        completed: "completed",
        paused: "pending",
        interrupted: "locked",
      };
      return (
        <Badge variant={variants[item.status] || "outline"}>
          {(item.status || "Unknown")
            .replace("_", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>
      );
    },
  },
  {
    key: "lastActivity",
    header: "Last Activity",
    render: (item: UserLessonProgress) => (
      <span className="text-muted-foreground">
        {new Date(item.lastActivity).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    render: (item: UserLessonProgress) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handlers.onGrantPause(item)}>
            <Plus className="h-4 w-4 mr-2" />
            Grant Extra Pause
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlers.onResetLesson(item)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Lesson
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlers.onLockLesson(item)}>
            <Lock className="h-4 w-4 mr-2" />
            Lock Lesson
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: "w-12",
  },
];

export default function AdminMonitoring() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserLessonProgress | null>(null);
  const [pauseCount, setPauseCount] = useState("1");
  const [isGranting, setIsGranting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useMonitoringStats();
  const typedData = data as unknown as MonitoringResponse;

  const monitoringData: UserLessonProgress[] = typedData?.monitoring || [];
  const stats = typedData?.stats || {
    activeSessions: 0,
    completedToday: 0,
    interrupted: 0,
    pauseRequests: 0,
  };

  // Open dialog for granting pauses
  const handleGrantPause = (item: UserLessonProgress) => {
    setSelectedUser(item);
    setPauseCount("1");
    setPauseDialogOpen(true);
  };

  // Actually grant the pauses
  const confirmGrantPause = async () => {
    if (!selectedUser) return;

    setIsGranting(true);
    try {
      const count = parseInt(pauseCount);
      await progressApi.grantPause(selectedUser.userId, selectedUser.lessonId, count);
      toast({
        title: "Pause Granted",
        description: `Added ${count} extra pause(s) for ${selectedUser.userName} on "${selectedUser.lessonTitle}"`,
      });
      setPauseDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to grant extra pause",
        variant: "destructive",
      });
    } finally {
      setIsGranting(false);
    }
  };

  const handleResetLesson = async (item: UserLessonProgress) => {
    if (
      !confirm(
        `Are you sure you want to reset "${item.lessonTitle}" progress for ${item.userName}? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await progressApi.resetLesson(item.userId, item.lessonId);
      toast({
        title: "Lesson Reset",
        description: `Reset progress for ${item.userName} on "${item.lessonTitle}"`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset lesson progress",
        variant: "destructive",
      });
    }
  };

  const handleLockLesson = async (item: UserLessonProgress) => {
    try {
      await progressApi.lockLesson(item.userId, item.lessonId);
      toast({
        title: "Lesson Locked",
        description: `Locked "${item.lessonTitle}" for ${item.userName}`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lock lesson",
        variant: "destructive",
      });
    }
  };

  const progressColumns = getProgressColumns({
    onGrantPause: handleGrantPause,
    onResetLesson: handleResetLesson,
    onLockLesson: handleLockLesson,
  });

  const filteredProgress = monitoringData.filter((item) => {
    const matchesSearch =
      (item.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lessonTitle || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:ml-64">
          <AdminHeader
            title="Lesson Monitoring"
            subtitle="Track user progress and manage playback"
          />
          <main className="p-4 lg:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminHeader
          title="Lesson Monitoring"
          subtitle="Track user progress and manage playback"
        />

        <main className="p-4 lg:p-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or lesson..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 lg:w-80 pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={
                    statusFilter === "in_progress" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setStatusFilter("in_progress")}
                >
                  In Progress
                </Button>
                <Button
                  variant={
                    statusFilter === "interrupted" ? "warning" : "outline"
                  }
                  size="sm"
                  onClick={() => setStatusFilter("interrupted")}
                >
                  Interrupted
                </Button>
              </div>
            </div>
            {/* Auto-refresh indicator or controls could go here */}
            <div className="text-xs text-muted-foreground self-center">
              Live updates active
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                Active Sessions (1h)
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">
                {String(stats.activeSessions || 0)}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                Completed Today
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-success">
                {String(stats.completedToday || 0)}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                Interrupted
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-destructive">
                {String(stats.interrupted || 0)}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                Pause Requests
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-warning">
                {String(stats.pauseRequests || 0)}
              </p>
            </div>
          </div>

          {/* Progress Table */}
          <div className="overflow-x-auto">
            <DataTable columns={progressColumns} data={filteredProgress} />
          </div>

          {/* Grant Extra Pause Dialog */}
          <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">Grant Extra Pause</DialogTitle>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4 py-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User</span>
                      <span className="font-medium">{selectedUser.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lesson</span>
                      <span className="font-medium">{selectedUser.lessonTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Pauses</span>
                      <span className="font-medium text-destructive">
                        {selectedUser.pausesUsed} / {selectedUser.maxPauses} used
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pauseCount">Number of Pauses to Grant</Label>
                    <Select value={pauseCount} onValueChange={setPauseCount}>
                      <SelectTrigger id="pauseCount">
                        <SelectValue placeholder="Select number" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} pause{num > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This will allow the user to pause {pauseCount} more time{parseInt(pauseCount) > 1 ? 's' : ''} during the lesson.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setPauseDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="premium"
                      className="flex-1"
                      onClick={confirmGrantPause}
                      disabled={isGranting}
                    >
                      {isGranting ? 'Granting...' : `Grant ${pauseCount} Pause${parseInt(pauseCount) > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
