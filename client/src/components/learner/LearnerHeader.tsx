import { NotificationBell } from "./NotificationBell";

interface LearnerHeaderProps {
  userName?: string;
}

export function LearnerHeader({ userName = "User" }: LearnerHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <p className="font-medium text-foreground">{userName}</p>
        </div>
        <NotificationBell />
      </div>
    </header>
  );
}
