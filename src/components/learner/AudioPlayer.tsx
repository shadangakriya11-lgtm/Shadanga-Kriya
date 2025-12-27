import { useState, useEffect, useCallback } from 'react';
import { Lesson, PlaybackState } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, ChevronLeft, WifiOff, Volume2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: () => void;
}

export function AudioPlayer({ lesson, onBack, onComplete }: AudioPlayerProps) {
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: lesson.durationSeconds,
    pausesRemaining: lesson.maxPauses - lesson.pausesUsed,
    isPaused: false,
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isComplete, setIsComplete] = useState(false);

  // Simulate playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playback.isPlaying && !isComplete) {
      interval = setInterval(() => {
        setPlayback((prev) => {
          const newTime = prev.currentTime + 1;
          if (newTime >= prev.duration) {
            setIsComplete(true);
            return { ...prev, isPlaying: false, currentTime: prev.duration };
          }
          return { ...prev, currentTime: newTime };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playback.isPlaying, isComplete]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const togglePlayback = useCallback(() => {
    if (isComplete) return;
    
    if (playback.isPlaying) {
      // Pausing
      if (playback.pausesRemaining > 0) {
        setPlayback((prev) => ({
          ...prev,
          isPlaying: false,
          isPaused: true,
          pausesRemaining: prev.pausesRemaining - 1,
        }));
      }
    } else {
      // Playing
      setPlayback((prev) => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }));
    }
  }, [playback.isPlaying, playback.pausesRemaining, isComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (playback.currentTime / playback.duration) * 100;
  const remainingTime = playback.duration - playback.currentTime;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-4 px-4 py-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={onComplete}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Session Complete</p>
              <h1 className="font-serif text-lg font-semibold truncate">{lesson.title}</h1>
            </div>
          </div>
        </header>

        {/* Completion Screen */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="animate-scale-in text-center max-w-md">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-success/15 text-success mb-6">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-3">
              Session Complete
            </h2>
            <p className="text-muted-foreground mb-8">
              You have successfully completed this lesson. Take a moment to reflect on your experience before continuing.
            </p>
            <Button variant="therapy" size="xl" className="w-full" onClick={onComplete}>
              Continue to Course
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Now Playing</p>
              <h1 className="font-serif text-lg font-semibold truncate max-w-48">{lesson.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOffline && (
              <Badge variant="pending" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Visualization */}
        <div className="relative mb-12">
          <div
            className={cn(
              "h-64 w-64 rounded-full flex items-center justify-center transition-all duration-700",
              playback.isPlaying
                ? "bg-gradient-to-br from-primary/20 to-success/20 animate-breathe"
                : "bg-muted"
            )}
          >
            <div
              className={cn(
                "h-48 w-48 rounded-full flex items-center justify-center transition-all duration-500",
                playback.isPlaying
                  ? "bg-gradient-to-br from-primary/30 to-success/30"
                  : "bg-card"
              )}
            >
              <div
                className={cn(
                  "h-32 w-32 rounded-full flex items-center justify-center transition-all duration-300",
                  playback.isPlaying
                    ? "bg-gradient-to-br from-primary to-success shadow-elevated"
                    : "bg-muted shadow-soft"
                )}
              >
                <Volume2
                  className={cn(
                    "h-12 w-12 transition-colors",
                    playback.isPlaying ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Time Display */}
        <div className="text-center mb-8">
          <p className="font-serif text-5xl font-bold text-foreground mb-2">
            {formatTime(remainingTime)}
          </p>
          <p className="text-muted-foreground">remaining</p>
        </div>

        {/* Progress Bar (non-interactive) */}
        <div className="w-full max-w-md mb-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{formatTime(playback.currentTime)}</span>
            <span>{formatTime(playback.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6">
          <Button
            variant={playback.isPlaying ? "soft" : "therapy"}
            size="icon-xl"
            className="rounded-full"
            onClick={togglePlayback}
            disabled={!playback.isPlaying && playback.pausesRemaining === 0}
          >
            {playback.isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>

          {/* Pause Counter */}
          <div className="text-center">
            <Badge
              variant={playback.pausesRemaining > 0 ? "secondary" : "locked"}
              className="px-4 py-1.5"
            >
              {playback.pausesRemaining} pause{playback.pausesRemaining !== 1 ? 's' : ''} remaining
            </Badge>
            {playback.pausesRemaining === 0 && !playback.isPlaying && (
              <p className="text-xs text-muted-foreground mt-2">
                Contact admin for additional pauses
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          Seeking is disabled. Please listen continuously for best results.
        </p>
      </footer>
    </div>
  );
}
