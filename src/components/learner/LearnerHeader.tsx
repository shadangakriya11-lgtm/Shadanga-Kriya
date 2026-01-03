import { Button } from '@/components/ui/button';
import { User, Menu } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

interface LearnerHeaderProps {
  userName?: string;
  onMenuClick?: () => void;
}

export function LearnerHeader({ userName = 'User', onMenuClick }: LearnerHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <p className="font-medium text-foreground">{userName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
