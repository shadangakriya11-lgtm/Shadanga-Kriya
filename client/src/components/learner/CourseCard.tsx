import { Course } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { shouldShowPricing } from '@/lib/platformDetection';

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const statusConfig = {
  active: { variant: 'active' as const, label: 'Active', icon: null },
  completed: { variant: 'completed' as const, label: 'Completed', icon: CheckCircle2 },
  locked: { variant: 'locked' as const, label: 'Locked', icon: Lock },
  pending: { variant: 'pending' as const, label: 'Pending', icon: null },
};

const typeConfig = {
  self: { variant: 'self' as const, label: 'Self-Paced' },
  onsite: { variant: 'onsite' as const, label: 'On-Site' },
};

export function CourseCard({ course, onClick, className, style }: CourseCardProps) {
  const status = statusConfig[course.status];
  const type = typeConfig[course.type];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        "group relative bg-card rounded-xl border border-border/50 p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:border-border cursor-pointer",
        course.status === 'locked' && "opacity-75",
        className
      )}
      style={style}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-2">
          <Badge variant={type.variant}>{type.label}</Badge>
          <Badge variant={status.variant} className="flex items-center gap-1">
            {StatusIcon && <StatusIcon className="h-3 w-3" />}
            {status.label}
          </Badge>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>

      {/* Title & Description */}
      <h3 className="font-serif text-xl font-semibold text-foreground mb-2 leading-tight">
        {course.title}
      </h3>
      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
        {course.description}
      </p>

      {/* Meta Info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" />
          <span>{course.totalLessons} lessons</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{course.duration}</span>
        </div>
      </div>

      {/* Progress Bar */}
      {course.status !== 'locked' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{course.progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                course.progress === 100 ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${course.progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {course.completedLessons} of {course.totalLessons} lessons completed
          </p>
        </div>
      )}

      {/* Locked State */}
      {course.status === 'locked' && (
        <div className="flex items-center gap-2 text-locked-foreground bg-locked/10 rounded-lg px-3 py-2">
          <Lock className="h-4 w-4" />
          <span className="text-sm">Complete prerequisites to unlock</span>
        </div>
      )}
    </div>
  );
}
