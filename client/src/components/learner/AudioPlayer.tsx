import { useState, useEffect, useCallback, useRef } from "react";
import { Lesson, PlaybackState } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  ChevronLeft,
  WifiOff,
  Wifi,
  Volume2,
  CheckCircle2,
  Download,
  Loader2,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCachedToken } from "@/lib/api";
import {
  isLessonDownloaded,
  loadEncryptedAudio,
  revokeAudioBlobUrl,
} from "@/lib/downloadManager";
import { isAirplaneModeEnabled, requestExclusiveAudioFocus, abandonAudioFocus, isRingerSilent, getSilentModeInstructions } from "@/lib/deviceChecks";
import { useToast } from "@/hooks/use-toast";
import { usePlaybackSettings } from "@/hooks/useApi";
import { Capacitor } from "@capacitor/core";
import { useFocusMode } from "@/hooks/useFocusMode";

interface AudioPlayerProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: () => void;
}

export function AudioPlayer({ lesson, onBack, onComplete }: AudioPlayerProps) {
  const token = getCachedToken();
  const { toast } = useToast();
  const { data: playbackSettings } = usePlaybackSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const autoSkipTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if running on native platform (APK/iOS)
  const isNativePlatform = Capacitor.isNativePlatform();

  // Get settings with defaults
  const offlineModeRequired = playbackSettings?.offlineModeRequired ?? true;
  const autoSkipOnMaxPauses = playbackSettings?.autoSkipOnMaxPauses ?? true;
  const autoSkipDelaySeconds = playbackSettings?.autoSkipDelaySeconds ?? 30;
  const screenLockEnabled = playbackSettings?.screenLockEnabled ?? true;

  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: lesson.durationSeconds || 0,
    pausesRemaining: lesson.maxPauses - (lesson.pausesUsed || 0),
    isPaused: false,
  });
  // We treat 'isOffline' as 'isAirplaneModeEnabled' effectively
  const [isOffline, setIsOffline] = useState(false); // Default to false, will update on mount
  const [isComplete, setIsComplete] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);
  const [audioSource, setAudioSource] = useState<"online" | "offline" | null>(
    null
  );
  const [offlineEnforcementError, setOfflineEnforcementError] = useState<
    string | null
  >(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Focus Mode Hook (Keep Awake + Immersive Mode)
  useFocusMode(playback.isPlaying);

  // Poll for Airplane Mode Status (Global for this component)
  useEffect(() => {
    const checkStatus = async () => {
      const airplaneOn = await isAirplaneModeEnabled();
      // If Airplane Mode is ON, we are "offline" (good).
      // If Airplane Mode is OFF, we are "online" (bad).
      setIsOffline(airplaneOn);
    };

    checkStatus(); // Initial check
    const interval = setInterval(checkStatus, 2000); // UI updates every 2s
    return () => clearInterval(interval);
  }, []);

  // SECURITY: Block audio playback on web browsers
  if (!isNativePlatform) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-destructive/15 text-destructive mb-6">
            <Smartphone className="h-10 w-10" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
            App Required
          </h2>
          <p className="text-muted-foreground mb-6">
            Audio lessons can only be played on the official Shadanga Kriya mobile app.
            Please download and install the app on your Android or iOS device.
          </p>
          <Button variant="premium" onClick={onBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Request wake lock to prevent screen from sleeping during playback
  const requestWakeLock = useCallback(async () => {
    if (!screenLockEnabled) return;

    // Request exclusive audio focus (Android) - silences other apps
    const focusResult = await requestExclusiveAudioFocus();
    if (focusResult.granted) {
      console.log("Exclusive audio focus granted");
    } else {
      console.warn("Audio focus not granted:", focusResult.message);
    }

    // Request screen wake lock
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        console.log("Wake lock acquired");
      } catch (err) {
        console.warn("Wake lock request failed:", err);
      }
    }
  }, [screenLockEnabled]);

  // Release wake lock and audio focus
  const releaseWakeLock = useCallback(async () => {
    // Abandon audio focus
    await abandonAudioFocus();
    console.log("Audio focus released");

    // Release screen wake lock
    if (wakeLockRef.current) {
      wakeLockRef.current
        .release()
        .then(() => {
          wakeLockRef.current = null;
          console.log("Wake lock released");
        })
        .catch(console.warn);
    }
  }, []);

  // Check ringer mode on mount and warn if not silent
  useEffect(() => {
    const checkRingerMode = async () => {
      const ringerStatus = await isRingerSilent();
      if (!ringerStatus.isSilent && ringerStatus.mode !== "unknown") {
        toast({
          title: "📱 Silent Mode Recommended",
          description: getSilentModeInstructions(),
          variant: "destructive",
          duration: 8000,
        });
      }
    };
    checkRingerMode();
  }, [toast]);

  // Auto-skip lesson when max pauses exhausted while paused
  const startAutoSkipTimer = useCallback(() => {
    if (!autoSkipOnMaxPauses) return;

    // Clear any existing timer
    if (autoSkipTimerRef.current) {
      clearTimeout(autoSkipTimerRef.current);
    }

    // Set timer to auto-complete the lesson based on settings
    autoSkipTimerRef.current = setTimeout(() => {
      toast({
        title: "Lesson Auto-Completed",
        description:
          "Maximum pauses exhausted. The lesson has been marked as complete.",
        variant: "default",
      });
      setIsComplete(true);
      setPlayback((prev) => ({
        ...prev,
        isPlaying: false,
      }));
      releaseWakeLock();
    }, autoSkipDelaySeconds * 1000);

    toast({
      title: "No Pauses Remaining",
      description: `Lesson will auto-complete in ${autoSkipDelaySeconds} seconds. Contact admin for additional pauses.`,
      variant: "destructive",
    });
  }, [toast, releaseWakeLock, autoSkipOnMaxPauses, autoSkipDelaySeconds]);

  // ENFORCEMENT: Monitor Airplane Mode (Strict) during playback
  useEffect(() => {
    if (!offlineModeRequired) return;

    let intervalId: NodeJS.Timeout;

    const checkCompliance = async () => {
      // If we are playing, we MUST be in Airplane Mode
      if (playback.isPlaying) {
        const isAirplaneOn = await isAirplaneModeEnabled();

        if (!isAirplaneOn) {
          // Violation detected! Stop everything.
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setPlayback((prev) => ({ ...prev, isPlaying: false }));
          setOfflineEnforcementError(
            "Airplane Mode Disabled! Playback stopped. Please enable Airplane Mode strictly."
          );
          releaseWakeLock();
        } else {
          // Clear error if compliance returns
          setOfflineEnforcementError(null);
        }
      }
    };

    // Run check immediately and then poll
    if (playback.isPlaying) {
      checkCompliance();
      intervalId = setInterval(checkCompliance, 2000); // Check every 2 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [playback.isPlaying, releaseWakeLock, offlineModeRequired]);

  // Cleanup wake lock and auto-skip timer on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
      if (autoSkipTimerRef.current) {
        clearTimeout(autoSkipTimerRef.current);
      }
    };
  }, [releaseWakeLock]);

  // Initialize audio - OFFLINE-ONLY: Require downloaded audio
  useEffect(() => {
    let isMounted = true;

    const initializeAudio = async () => {
      setIsLoadingAudio(true);
      setAudioError(null);
      setOfflineEnforcementError(null);

      try {
        // Check if lesson is downloaded for offline use
        const downloaded = await isLessonDownloaded(lesson.id);
        setIsDownloaded(downloaded);

        // OFFLINE-ONLY ENFORCEMENT: Must have downloaded audio
        if (!downloaded) {
          throw new Error(
            "This lesson must be downloaded before playback. Please download the lesson first."
          );
        }

        // Check if online - warn user to go offline (only if offline mode required)
        if (offlineModeRequired && !isOffline) {
          setOfflineEnforcementError(
            "Please disconnect from the internet (airplane mode) before playing this lesson."
          );
        }

        let audioUrl: string;

        // Load encrypted audio from local storage (offline-only)
        try {
          audioUrl = await loadEncryptedAudio(lesson.id, token!);
          audioBlobUrlRef.current = audioUrl;
          if (isMounted) setAudioSource("offline");
        } catch (err) {
          console.error("Failed to load offline audio:", err);
          throw new Error(
            "Failed to decrypt offline audio. Please re-download the lesson."
          );
        }

        if (!isMounted) return;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.addEventListener("loadedmetadata", () => {
          // Update duration from actual audio file
          if (audio.duration && audio.duration !== Infinity) {
            setPlayback((p) => ({ ...p, duration: audio.duration }));
          }
          setIsLoadingAudio(false);
        });

        audio.addEventListener("timeupdate", () => {
          setPlayback((prev) => ({
            ...prev,
            currentTime: audio.currentTime,
            duration: audio.duration || prev.duration,
          }));
        });

        audio.addEventListener("ended", () => {
          setIsComplete(true);
          setPlayback((prev) => ({
            ...prev,
            isPlaying: false,
            currentTime: audio.duration,
          }));
        });

        audio.addEventListener("error", (e) => {
          console.error("Audio playback error:", e);
          setAudioError("Failed to load audio. Please check your connection.");
          setIsLoadingAudio(false);
        });
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Failed to initialize audio";
          setAudioError(message);
          setIsLoadingAudio(false);
        }
      }
    };

    initializeAudio();

    return () => {
      isMounted = false;
      // Cleanup audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      // Revoke blob URL if we created one
      if (audioBlobUrlRef.current) {
        revokeAudioBlobUrl(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
    };
  }, [lesson.id, token, isOffline, offlineModeRequired]);

  const togglePlayback = useCallback(async () => {
    if (isComplete || !audioRef.current || audioError) return;

    // Check offline enforcement before playing (only if offline mode required)
    if (offlineModeRequired && !playback.isPlaying && !isOffline) {
      setOfflineEnforcementError(
        "Please disconnect from the internet (airplane mode) before playing."
      );
      return;
    }

    // Clear auto-skip timer when user resumes
    if (autoSkipTimerRef.current) {
      clearTimeout(autoSkipTimerRef.current);
      autoSkipTimerRef.current = null;
    }

    if (playback.isPlaying) {
      // Pausing
      if (playback.pausesRemaining > 0) {
        audioRef.current.pause();
        releaseWakeLock();
        const newPausesRemaining = playback.pausesRemaining - 1;
        setPlayback((prev) => ({
          ...prev,
          isPlaying: false,
          isPaused: true,
          pausesRemaining: newPausesRemaining,
        }));

        // If this was the last pause, start auto-skip timer
        if (newPausesRemaining === 0 && autoSkipOnMaxPauses) {
          startAutoSkipTimer();
        }
      } else {
        // No pauses left - start auto-skip timer
        audioRef.current.pause();
        releaseWakeLock();
        setPlayback((prev) => ({
          ...prev,
          isPlaying: false,
          isPaused: true,
        }));
        if (autoSkipOnMaxPauses) {
          startAutoSkipTimer();
        }
      }
    } else {
      // Starting playback - request wake lock and audio focus FIRST, then play
      // This prevents race conditions with audio focus interfering with playback
      await requestWakeLock();

      // Small delay to let the audio system settle after focus is granted
      await new Promise(resolve => setTimeout(resolve, 100));

      // Only update state AFTER play() succeeds
      audioRef.current?.play()
        .then(() => {
          // Play succeeded - now update the UI state
          setPlayback((prev) => ({
            ...prev,
            isPlaying: true,
            isPaused: false,
          }));
        })
        .catch((err) => {
          console.error("Play error:", err);
          releaseWakeLock();
          // Play failed - do NOT change state, show error
          toast({
            title: "Playback Failed",
            description: "Unable to start audio. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [
    playback.isPlaying,
    playback.pausesRemaining,
    isComplete,
    audioError,
    isOffline,
    offlineModeRequired,
    autoSkipOnMaxPauses,
    requestWakeLock,
    releaseWakeLock,
    startAutoSkipTimer,
    toast,
  ]);

  const formatTime = (seconds: number) => {
    if (!seconds && seconds !== 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentDuration = playback.duration || audioRef.current?.duration || 0;
  const progress =
    currentDuration > 0 ? (playback.currentTime / currentDuration) * 100 : 0;
  const remainingTime = Math.max(0, currentDuration - playback.currentTime);

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
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Session Complete
              </p>
              <h1 className="font-serif text-lg font-semibold truncate">
                {lesson.title}
              </h1>
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
              You have successfully completed this lesson. Take a moment to
              reflect on your experience before continuing.
            </p>
            <Button
              variant="therapy"
              size="xl"
              className="w-full"
              onClick={onComplete}
            >
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
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Now Playing
              </p>
              <h1 className="font-serif text-lg font-semibold truncate max-w-48">
                {lesson.title}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Offline Enforcement Warning */}
        {
          offlineEnforcementError && (
            <div className="mb-6 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg max-w-md text-center">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{offlineEnforcementError}</span>
            </div>
          )
        }

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
                    playback.isPlaying
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {
          audioError && (
            <div className="mb-4 text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-lg">
              {audioError}
            </div>
          )
        }

        {/* Loading State */}
        {
          isLoadingAudio && !audioError && (
            <div className="mb-6 flex flex-col items-center gap-2 text-primary animate-pulse">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Preparing Session...</span>
              </div>
              <p className="text-xs text-muted-foreground">Decrypting secure audio (may take a moment)</p>
            </div>
          )
        }

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
            <span>{formatTime(currentDuration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6">
          <Button
            variant={playback.isPlaying ? "soft" : "therapy"}
            size="icon-xl"
            className="rounded-full"
            onClick={togglePlayback}
            disabled={
              (!playback.isPlaying &&
                playback.pausesRemaining === 0 &&
                !autoSkipTimerRef.current) ||
              !!audioError ||
              isLoadingAudio ||
              (offlineModeRequired && !playback.isPlaying && !isOffline) // Disable play when online (if required)
            }
          >
            {isLoadingAudio ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : playback.isPlaying ? (
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
              {playback.pausesRemaining} pause
              {playback.pausesRemaining !== 1 ? "s" : ""} remaining
            </Badge>
            {playback.pausesRemaining === 0 &&
              !playback.isPlaying &&
              autoSkipOnMaxPauses && (
                <p className="text-xs text-destructive mt-2 font-medium">
                  Auto-completing in {autoSkipDelaySeconds} seconds. Contact
                  admin for additional pauses.
                </p>
              )}
          </div>
        </div>
      </main >

      <footer className="py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          Seeking is disabled. Please listen continuously for best results.
        </p>
      </footer>


    </div >
  );
}
