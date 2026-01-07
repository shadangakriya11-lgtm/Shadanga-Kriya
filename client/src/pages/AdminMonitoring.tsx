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
  const { toast } = useToast();

  const { data, isLoading, refetch } = useMonitoringStats();

  const monitoringData: UserLessonProgress[] = data?.monitoring || [];
  const stats = data?.stats || {
    activeSessions: 0,
    completedToday: 0,
    interrupted: 0,
    pauseRequests: 0,
  };

  // Action handlers for user progress management
  const handleGrantPause = async (item: UserLessonProgress) => {
    try {
      await progressApi.grantPause(item.userId, item.lessonId, 1);
      toast({
        title: "Pause Granted",
        description: `Added 1 extra pause for ${item.userName} on "${item.lessonTitle}"`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to grant extra pause",
        variant: "destructive",
      });
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
                {stats.activeSessions}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                Completed Today
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-success">
                {stats.completedToday}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                Interrupted
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-destructive">
                {stats.interrupted}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">
                Pause Requests
              </p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-warning">
                {stats.pauseRequests}
              </p>
            </div>
          </div>

          {/* Progress Table */}
          <div className="overflow-x-auto">
            <DataTable columns={progressColumns} data={filteredProgress} />
          </div>
        </main>
      </div>
    </div>
  );
}
