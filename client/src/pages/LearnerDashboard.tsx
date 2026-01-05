import { useState } from "react";
import { LearnerHeader } from "@/components/learner/LearnerHeader";
import { BottomNav } from "@/components/learner/BottomNav";
import {
  TrendingUp,
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useLearnerAnalytics } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format, subDays, parseISO } from "date-fns";

export default function LearnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useLearnerAnalytics();

  // Prepare data for Weekly Activity Chart
  const weeklyData =
    stats?.weeklyActivity?.map((item: any) => ({
      date: format(parseISO(item.date), "EEE"),
      completions: parseInt(item.count),
    })) || [];

  // Prepare data for Learning Time Chart
  const timeData =
    stats?.learningTimeTrend?.map((item: any) => ({
      date: format(parseISO(item.date), "MMM d"),
      minutes: Math.round(parseInt(item.seconds) / 60),
    })) || [];

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <LearnerHeader
        userName={user ? `${user.firstName} ${user.lastName}` : "User"}
      />

      <main className="px-4 py-6 max-w-3xl mx-auto space-y-8">
        {/* Welcome Section */}
        <section className="animate-fade-in">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Your Journey
          </h1>
          <p className="text-muted-foreground">
            Visualize your progress and maintain your daily meditation habits.
          </p>
        </section>

        {/* Real-time Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-soft">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "-" : stats?.streak || 0}
            </p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Day Streak
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-soft">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "-" : formatTime(stats?.total_learning_time || 0)}
            </p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Learning Time
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-soft">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "-" : stats?.completed_lessons || 0}
            </p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Completed
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-soft">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
              <TrendingUp className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "-" : `${stats?.avg_progress || 0}%`}
            </p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Avg Progress
            </p>
          </div>
        </section>

        {/* Weekly Lessons Completed Chart */}
        <section className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground">
                Weekly Activity
              </h3>
              <p className="text-xs text-muted-foreground">
                Number of lessons completed daily
              </p>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="h-[200px] w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(0,0,0,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#888" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="completions"
                    fill="hsl(174, 65%, 40%)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/30 rounded-xl">
                <p className="text-sm">No recent activity found</p>
              </div>
            )}
          </div>
        </section>

        {/* Learning Time Trend (Area Chart) */}
        <section className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground">
                Learning Consistency
              </h3>
              <p className="text-xs text-muted-foreground">
                Time spent meditating (minutes)
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="h-[200px] w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient
                      id="colorMinutes"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(174, 65%, 40%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(174, 65%, 40%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(0,0,0,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#888" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="hsl(174, 65%, 40%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMinutes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/30 rounded-xl">
                <p className="text-sm">Start your first session to see data</p>
              </div>
            )}
          </div>
        </section>

        {/* Active Courses List */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-semibold text-foreground">
              In Progress
            </h3>
            <button
              onClick={() => navigate("/home")}
              className="text-sm font-medium text-primary hover:underline"
            >
              All Courses
            </button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))
            ) : stats?.courses?.filter((c: any) => c.progress_percent < 100)
                .length > 0 ? (
              stats.courses
                .filter((c: any) => c.progress_percent < 100)
                .slice(0, 3)
                .map((course: any) => (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="bg-card rounded-2xl border border-border/50 p-4 shadow-soft flex items-center gap-4 cursor-pointer hover:shadow-card transition-shadow"
                  >
                    <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {course.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${course.progress_percent || 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {course.progress_percent || 0}%
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))
            ) : (
              <div className="text-center py-6 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <p className="text-sm text-muted-foreground">
                  No courses in progress
                </p>
                <button
                  onClick={() => navigate("/home")}
                  className="mt-2 text-primary font-medium hover:underline"
                >
                  Find a course
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
