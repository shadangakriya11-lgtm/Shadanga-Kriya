import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Play,
    Pause,
    ChevronLeft,
    Volume2,
    CheckCircle2,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { demoApi } from "@/lib/api";
import { useMarkDemoCompleted } from "@/hooks/useApi";

interface DemoPlayerProps {
    onComplete: () => void;
    onBack: () => void;
}

interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    isPaused: boolean;
}

export function DemoPlayer({ onComplete, onBack }: DemoPlayerProps) {
    const markDemoCompletedMutation = useMarkDemoCompleted();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    const [playback, setPlayback] = useState<PlaybackState>({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isPaused: false,
    });
    const [isComplete, setIsComplete] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [isLoadingAudio, setIsLoadingAudio] = useState(true);
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number; percent: number }>({
        loaded: 0,
        total: 0,
        percent: 0,
    });

    // Format bytes to human readable size
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 MB";
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    // Request wake lock to prevent screen from sleeping
    const requestWakeLock = useCallback(async () => {
        if ("wakeLock" in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request("screen");
                console.log("Wake lock acquired");
            } catch (err) {
                console.warn("Wake lock request failed:", err);
            }
        }
    }, []);

    // Release wake lock
    const releaseWakeLock = useCallback(() => {
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            releaseWakeLock();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }
        };
    }, [releaseWakeLock]);

    // Initialize demo audio from Cloudinary (plain MP3, no encryption)
    const initializeDemoAudio = useCallback(async () => {
        setIsLoadingAudio(true);
        setAudioError(null);
        setLoadingProgress({ loaded: 0, total: 0, percent: 0 });

        try {
            // Get demo audio info from backend
            const audioInfo = await demoApi.getAudioInfo();

            if (!audioInfo.audioUrl) {
                throw new Error("Demo audio not configured yet. Please contact support.");
            }

            console.log("Demo audio URL:", audioInfo.audioUrl);

            // Use XMLHttpRequest for better progress tracking in Android WebView
            const audioBlob = await new Promise<Blob>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", audioInfo.audioUrl, true);
                xhr.responseType = "blob";

                // Required for ngrok free tier to skip browser warning
                xhr.setRequestHeader("ngrok-skip-browser-warning", "true");

                // Expected file size (fallback): ~54MB
                const expectedSize = 56274000; // approximate bytes

                xhr.onloadstart = () => {
                    console.log("Download started...");
                    setLoadingProgress({
                        loaded: 0,
                        total: expectedSize,
                        percent: 1, // Show 1% to indicate connection established
                    });
                };

                xhr.onprogress = (event) => {
                    const total = event.lengthComputable ? event.total : expectedSize;
                    const loaded = event.loaded;
                    const percent = Math.round((loaded / total) * 100);

                    console.log(`Download progress: ${loaded} / ${total} (${percent}%)`);

                    setLoadingProgress({
                        loaded,
                        total,
                        percent: Math.min(Math.max(percent, 1), 100), // Keep between 1-100%
                    });
                };

                xhr.onload = () => {
                    console.log("Download complete, status:", xhr.status);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setLoadingProgress({
                            loaded: xhr.response.size,
                            total: xhr.response.size,
                            percent: 100,
                        });
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`Failed to fetch audio: ${xhr.status} ${xhr.statusText}`));
                    }
                };

                xhr.onerror = () => {
                    console.error("XHR error occurred");
                    reject(new Error("Network error while downloading audio. Please check your connection."));
                };

                xhr.ontimeout = () => {
                    console.error("XHR timeout");
                    reject(new Error("Download timed out. Please try again."));
                };

                // Start download
                console.log("Starting download from:", audioInfo.audioUrl);
                xhr.send();
            });

            console.log("Audio blob created, size:", audioBlob.size);

            // Create object URL from blob
            const audioUrl = URL.createObjectURL(audioBlob);

            // Create audio element with blob URL
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.addEventListener("loadedmetadata", () => {
                if (audio.duration && audio.duration !== Infinity) {
                    setPlayback((p) => ({ ...p, duration: audio.duration }));
                }
                setIsLoadingAudio(false);
                setIsAudioReady(true);
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
                releaseWakeLock();
                // Mark demo as completed
                markDemoCompletedMutation.mutate();
                // Revoke the blob URL when done
                URL.revokeObjectURL(audioUrl);
            });

            audio.addEventListener("error", (e) => {
                console.error("Audio playback error:", e);
                setAudioError("Failed to load demo audio. Please check your connection.");
                setIsLoadingAudio(false);
                URL.revokeObjectURL(audioUrl);
            });

            // Preload the audio (should be instant since data is already loaded)
            audio.load();

        } catch (err) {
            console.error("Demo audio initialization error:", err);
            const message = err instanceof Error ? err.message : "Failed to initialize demo audio";
            setAudioError(message);
            setIsLoadingAudio(false);
        }
    }, [releaseWakeLock]); // Removed markDemoCompletedMutation from deps to prevent infinite loop

    // Track if we've already started initialization
    const hasInitialized = useRef(false);

    // Auto-initialize on mount - only once
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;
        initializeDemoAudio();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const togglePlayback = useCallback(() => {
        if (isComplete || !audioRef.current || audioError) return;

        if (playback.isPlaying) {
            audioRef.current.pause();
            releaseWakeLock();
            setPlayback((prev) => ({
                ...prev,
                isPlaying: false,
                isPaused: true,
            }));
        } else {
            requestWakeLock();
            audioRef.current.play().catch((err) => {
                console.error("Play error:", err);
                releaseWakeLock();
            });
            setPlayback((prev) => ({
                ...prev,
                isPlaying: true,
                isPaused: false,
            }));
        }
    }, [
        playback.isPlaying,
        isComplete,
        audioError,
        requestWakeLock,
        releaseWakeLock,
    ]);

    const formatTime = (seconds: number) => {
        if (!seconds && seconds !== 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const currentDuration = playback.duration || audioRef.current?.duration || 0;
    const progress = currentDuration > 0 ? (playback.currentTime / currentDuration) * 100 : 0;
    const remainingTime = Math.max(0, currentDuration - playback.currentTime);

    // Completion Screen
    if (isComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
                <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
                    <div className="flex items-center gap-4 px-4 py-4 max-w-2xl mx-auto">
                        <Button variant="ghost" size="icon" onClick={onComplete}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Demo Complete
                            </p>
                            <h1 className="font-serif text-lg font-semibold">Demo Meditation</h1>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                    <div className="animate-scale-in text-center max-w-md">
                        <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-success/15 text-success mb-6">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>
                        <h2 className="font-serif text-3xl font-semibold text-foreground mb-3">
                            🙏 Demo पूर्ण हुआ
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            आपने सफलतापूर्वक Demo Meditation पूरा कर लिया है।
                        </p>
                        <p className="text-sm text-muted-foreground mb-8">
                            अपने अनुभव पर विचार करें और जब तैयार हों, हमारे पूर्ण कोर्स के साथ अपनी यात्रा जारी रखें।
                        </p>
                        <Button
                            variant="therapy"
                            size="xl"
                            className="w-full bg-gradient-to-r from-primary to-primary/80"
                            onClick={onComplete}
                        >
                            Continue to Dashboard
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    // Main Player Screen
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Demo Meditation
                            </p>
                            <h1 className="font-serif text-lg font-semibold">Now Playing</h1>
                        </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                        🎧 Demo
                    </Badge>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                {/* Loading State with Progress */}
                {isLoadingAudio && !audioError && (
                    <div className="mb-8 text-center w-full max-w-sm">
                        {/* Circular Progress Indicator */}
                        <div className="relative inline-flex items-center justify-center h-28 w-28 mb-6">
                            {/* Background circle */}
                            <svg className="absolute h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-muted/30"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    className="text-primary transition-all duration-300"
                                    strokeDasharray={`${2 * Math.PI * 45}`}
                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - loadingProgress.percent / 100)}`}
                                />
                            </svg>
                            {/* Percentage text */}
                            <span className="text-2xl font-bold text-primary">
                                {loadingProgress.percent}%
                            </span>
                        </div>

                        <p className="text-foreground font-medium mb-2">Loading Demo Audio...</p>

                        {/* Progress bar */}
                        <div className="w-full bg-muted/30 rounded-full h-2 mb-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-300"
                                style={{ width: `${loadingProgress.percent}%` }}
                            />
                        </div>

                        {/* Size info */}
                        {loadingProgress.total > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {formatBytes(loadingProgress.loaded)} / {formatBytes(loadingProgress.total)}
                            </p>
                        )}
                        {loadingProgress.total === 0 && loadingProgress.percent === 0 && (
                            <p className="text-sm text-muted-foreground">Connecting...</p>
                        )}
                    </div>
                )}

                {/* Visualization */}
                {!isLoadingAudio && !audioError && (
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
                )}

                {/* Error Message */}
                {audioError && (
                    <div className="mb-4 text-destructive font-medium bg-destructive/10 px-4 py-3 rounded-lg max-w-md text-center">
                        <AlertTriangle className="h-5 w-5 inline mr-2" />
                        {audioError}
                    </div>
                )}

                {/* Time Display & Controls */}
                {isAudioReady && !isLoadingAudio && (
                    <>
                        <div className="text-center mb-8">
                            <p className="font-serif text-5xl font-bold text-foreground mb-2">
                                {formatTime(remainingTime)}
                            </p>
                            <p className="text-muted-foreground">remaining</p>
                        </div>

                        {/* Progress Bar */}
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
                                className={cn(
                                    "rounded-full",
                                    !playback.isPlaying && "bg-gradient-to-r from-primary to-primary/80 shadow-lg"
                                )}
                                onClick={togglePlayback}
                                disabled={!!audioError || isLoadingAudio}
                            >
                                {isLoadingAudio ? (
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                ) : playback.isPlaying ? (
                                    <Pause className="h-8 w-8" />
                                ) : (
                                    <Play className="h-8 w-8 ml-1" />
                                )}
                            </Button>

                            {/* One-time notice */}
                            <Badge variant="secondary" className="px-4 py-1.5">
                                One-time Demo
                            </Badge>
                        </div>
                    </>
                )}
            </main>

            {/* Footer Notice */}
            <footer className="py-4 px-4 text-center">
                <p className="text-xs text-muted-foreground">
                    यह Demo केवल एक बार सुना जा सकता है। कृपया ध्यान से सुनें।
                </p>
            </footer>
        </div>
    );
}

