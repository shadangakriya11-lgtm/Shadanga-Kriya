import { Lesson } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Lock, CheckCircle2, Play, Pause, KeyRound, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { DownloadButton } from "./DownloadButton";
import { useState } from "react";
import { Capacitor } from "@capacitor/core";

interface LessonCardProps {
  lesson: Lesson;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  showDownload?: boolean;
  courseId?: string;
}

const statusConfig = {
  active: { variant: "active" as const, label: "Ready", canPlay: true },
  completed: {
    variant: "completed" as const,
    label: "Completed",
    canPlay: false,
  },
  locked: { variant: "locked" as const, label: "Locked", canPlay: false },
  skipped: { variant: "pending" as const, label: "Skipped", canPlay: false },
};

export function LessonCard({
  lesson,
  onClick,
  className,
  style,
  showDownload = true,
  courseId,
}: LessonCardProps) {
  const status = statusConfig[lesson.status];
  const [isDownloaded, setIsDownloaded] = useState<boolean | undefined>(undefined);
  const isNativePlatform = Capacitor.isNativePlatform();
  const isCardClickable = status.canPlay && (isNativePlatform ? isDownloaded === true : true);

  // On native: show play/key only when downloaded. On browser: always show (no download concept).
  const shouldShowAction = status.canPlay && (isNativePlatform ? isDownloaded === true : true);

  return (
    <div
      className={cn(
        "group flex items-center gap-4 bg-card rounded-xl border border-border/50 p-4 transition-all duration-200",
        isCardClickable &&
        "hover:shadow-soft hover:border-border cursor-pointer",
        lesson.status === "locked" && "opacity-60",
        className
      )}
      style={style}
      onClick={isCardClickable ? onClick : undefined}
    >
      {/* Order Number / Status Icon */}
      <div
        className={cn(
          "flex items-center justify-center h-12 w-12 rounded-full text-lg font-semibold transition-colors shrink-0",
          lesson.status === "completed" && "bg-success/15 text-success",
          lesson.status === "active" && "bg-primary text-primary-foreground",
          lesson.status === "locked" && "bg-locked/15 text-locked-foreground",
          lesson.status === "skipped" && "bg-warning/15 text-warning-foreground"
        )}
      >
        {lesson.status === "completed" ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : lesson.status === "locked" ? (
          <Lock className="h-5 w-5" />
        ) : (
          lesson.order
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h4 className="font-medium text-foreground line-clamp-2 flex-1">
            {lesson.title}
          </h4>
          {lesson.status !== "active" && (
            <Badge variant={status.variant} className="shrink-0 text-xs mt-0.5">
              {status.label}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {lesson.description}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{lesson.duration}</span>
          </div>
        </div>
      </div>

      {/* Download Button - Only for unlocked lessons with audio */}
      {showDownload &&
        lesson.status !== "locked" &&
        lesson.audioUrl &&
        courseId && (
          <div onClick={(e) => e.stopPropagation()}>
            <DownloadButton
              lessonId={lesson.id}
              courseId={courseId}
              lessonTitle={lesson.title}
              variant="icon"
              onDownloadStatusChange={setIsDownloaded}
            />
          </div>
        )}

      {/* Action Icon Logic:
          - Browser: always show play/key (no download concept)
          - Native (iOS/Android): show only after lesson is downloaded
            - Downloaded + no access code lock => Play icon
            - Downloaded + access code locked  => Key icon
            - Not downloaded                   => nothing (DownloadButton handles it)
      */}
      {shouldShowAction && (
        <>
          {/* Case 1: Access code disabled - show Play icon */}
          {!lesson.accessCodeEnabled && (
            <Button
              variant="therapy"
              size="icon"
              className="shrink-0 rounded-full transition-colors"
            >
              <Play className="h-5 w-5" />
            </Button>
          )}

          {/* Case 2: Access code enabled AND has code - show Key icon */}
          {lesson.accessCodeEnabled && lesson.hasAccessCode && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 rounded-full opacity-100 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <KeyRound className="h-5 w-5" />
            </Button>
          )}

          {/* Case 3: Access code enabled but NO code - show nothing (admin needs to set code) */}
        </>
      )}
    </div>
  );
}
