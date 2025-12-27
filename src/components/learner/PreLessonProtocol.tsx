import { useState } from 'react';
import { Lesson, PreLessonChecklist } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plane, Headphones, Brain, ChevronLeft, Play, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreLessonProtocolProps {
  lesson: Lesson;
  onBack: () => void;
  onStart: () => void;
}

const checklistItems = [
  {
    id: 'flightModeEnabled',
    icon: Plane,
    title: 'Flight Mode Enabled',
    description: 'Enable airplane mode to prevent interruptions during your session.',
  },
  {
    id: 'earbudsConnected',
    icon: Headphones,
    title: 'Earphones Connected',
    description: 'Use quality earphones or headphones for optimal audio experience.',
  },
  {
    id: 'focusAcknowledged',
    icon: Brain,
    title: 'Focus Commitment',
    description: 'I am in a quiet space and ready to focus completely on this session.',
  },
] as const;

export function PreLessonProtocol({ lesson, onBack, onStart }: PreLessonProtocolProps) {
  const [checklist, setChecklist] = useState<PreLessonChecklist>({
    flightModeEnabled: false,
    earbudsConnected: false,
    focusAcknowledged: false,
  });

  const allChecked = Object.values(checklist).every(Boolean);

  const toggleItem = (id: keyof PreLessonChecklist) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-4 px-4 py-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pre-Session Protocol</p>
            <h1 className="font-serif text-lg font-semibold truncate">{lesson.title}</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-8 max-w-2xl mx-auto">
        {/* Introduction */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
            Prepare Your Environment
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            For optimal therapeutic benefit, please ensure the following conditions are met before beginning your session.
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-4 mb-10">
          {checklistItems.map((item, index) => {
            const Icon = item.icon;
            const isChecked = checklist[item.id];

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-xl border transition-all duration-300 cursor-pointer animate-fade-in",
                  isChecked
                    ? "bg-success/5 border-success/30"
                    : "bg-card border-border/50 hover:border-border"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => toggleItem(item.id)}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-12 w-12 rounded-full transition-colors shrink-0",
                    isChecked ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleItem(item.id)}
                  className="mt-1 h-6 w-6 rounded-md"
                />
              </div>
            );
          })}
        </div>

        {/* Session Info */}
        <div className="bg-muted/50 rounded-xl p-5 mb-8">
          <h4 className="font-medium text-foreground mb-2">Session Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{lesson.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pauses Available</span>
              <span className="font-medium">{lesson.maxPauses - lesson.pausesUsed} of {lesson.maxPauses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Playback</span>
              <span className="font-medium">No seeking allowed</span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          variant={allChecked ? "therapy" : "locked"}
          size="xl"
          className="w-full"
          disabled={!allChecked}
          onClick={onStart}
        >
          <Play className="h-5 w-5 mr-2" />
          {allChecked ? "Begin Session" : "Complete Checklist to Continue"}
        </Button>

        {!allChecked && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Please confirm all items above to proceed
          </p>
        )}
      </main>
    </div>
  );
}
