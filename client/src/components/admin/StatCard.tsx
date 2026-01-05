import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  className?: string;
  style?: React.CSSProperties;
}

export function StatCard({ title, value, change, trend = 'neutral', icon: Icon, className, style }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border/50 p-6 shadow-soft animate-fade-in",
        className
      )}
      style={style}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {change && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend === 'up' && "bg-success/15 text-success",
              trend === 'down' && "bg-destructive/15 text-destructive",
              trend === 'neutral' && "bg-muted text-muted-foreground"
            )}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="font-serif text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
