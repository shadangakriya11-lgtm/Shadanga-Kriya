import { Lesson } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Lock, CheckCircle2, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonCardProps {
  lesson: Lesson;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const statusConfig = {
  active: { variant: 'active' as const, label: 'Ready', canPlay: true },
  completed: { variant: 'completed' as const, label: 'Completed', canPlay: false },
  locked: { variant: 'locked' as const, label: 'Locked', canPlay: false },
  skipped: { variant: 'pending' as const, label: 'Skipped', canPlay: false },
};

export function LessonCard({ lesson, onClick, className, style }: LessonCardProps) {
  const status = statusConfig[lesson.status];

  return (
    <div
      className={cn(
        "group flex items-center gap-4 bg-card rounded-xl border border-border/50 p-4 transition-all duration-200",
        status.canPlay && "hover:shadow-soft hover:border-border cursor-pointer",
        lesson.status === 'locked' && "opacity-60",
        className
      )}
      style={style}
      onClick={status.canPlay ? onClick : undefined}
    >
      {/* Order Number / Status Icon */}
      <div
        className={cn(
          "flex items-center justify-center h-12 w-12 rounded-full text-lg font-semibold transition-colors shrink-0",
          lesson.status === 'completed' && "bg-success/15 text-success",
          lesson.status === 'active' && "bg-primary text-primary-foreground",
          lesson.status === 'locked' && "bg-locked/15 text-locked-foreground",
          lesson.status === 'skipped' && "bg-warning/15 text-warning-foreground"
        )}
      >
        {lesson.status === 'completed' ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : lesson.status === 'locked' ? (
          <Lock className="h-5 w-5" />
        ) : (
          lesson.order
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-foreground truncate">{lesson.title}</h4>
          <Badge variant={status.variant} className="shrink-0 text-xs">
            {status.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{lesson.duration}</span>
          </div>
          {lesson.status !== 'locked' && (
            <div className="flex items-center gap-1">
              <Pause className="h-3.5 w-3.5" />
              <span>{lesson.maxPauses - lesson.pausesUsed} pauses left</span>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      {status.canPlay && (
        <Button
          variant="therapy"
          size="icon"
          className="shrink-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Play className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
