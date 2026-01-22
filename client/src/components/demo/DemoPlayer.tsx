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
    Smartphone,
    Headphones,
    Plane,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarkDemoCompleted, usePlaybackSettings } from "@/hooks/useApi";
import { Capacitor } from "@capacitor/core";
import {
    isAirplaneModeEnabled,
    areEarphonesConnected,
    openAirplaneModeSettings,
} from "@/lib/deviceChecks";
import { useToast } from "@/hooks/use-toast";
import { useFocusMode } from "@/hooks/useFocusMode";

interface DemoPlayerProps {
    cachedAudioUrl: string | null;
    onComplete: () => void;
    onBack: () => void;
}

interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    isPaused: boolean;
    pausesRemaining: number;
}

// Demo has limited pauses (can be configured)
const DEMO_MAX_PAUSES = 3;

export function DemoPlayer({ cachedAudioUrl, onComplete, onBack }: DemoPlayerProps) {
    const { toast } = useToast();
    const markDemoCompletedMutation = useMarkDemoCompleted();
    const { data: playbackSettings } = usePlaybackSettings();

    // Get settings with defaults
    const offlineModeRequired = playbackSettings?.offlineModeRequired ?? true;
    const earphoneCheckEnabled = playbackSettings?.earphoneCheckEnabled ?? true;

    // Check if running on native platform (APK/iOS)
    const isNativePlatform = Capacitor.isNativePlatform();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    const [playback, setPlayback] = useState<PlaybackState>({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isPaused: false,
        pausesRemaining: DEMO_MAX_PAUSES,
    });
    const [isComplete, setIsComplete] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [isAudioReady, setIsAudioReady] = useState(false);

    // Compliance violation state for forced pause modal
    const [complianceViolation, setComplianceViolation] = useState<{
        type: "airplane" | "earphones" | null;
        message: string;
    }>({ type: null, message: "" });
    const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);

    // Focus Mode Hook (Keep Awake + Immersive Mode)
    useFocusMode(playback.isPlaying);

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
                        The demo meditation can only be played on the official Shadanga Kriya mobile app.
                        Please download and install the app on your Android or iOS device.
                    </p>
                    <Button variant="premium" onClick={onBack}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

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

    // ENFORCEMENT: Monitor Airplane Mode AND Earphones during playback
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const checkCompliance = async () => {
            // Only check if we are playing
            if (!playback.isPlaying) return;

            // Check Airplane Mode (if required)
            if (offlineModeRequired) {
                const isAirplaneOn = await isAirplaneModeEnabled();
                if (!isAirplaneOn) {
                    // Violation detected! Pause and show warning
                    if (audioRef.current) {
                        audioRef.current.pause();
                    }

                    // Reduce pause count for forced pause
                    const newPausesRemaining = Math.max(0, playback.pausesRemaining - 1);

                    setPlayback((prev) => ({
                        ...prev,
                        isPlaying: false,
                        isPaused: true,
                        pausesRemaining: newPausesRemaining,
                    }));
                    setComplianceViolation({
                        type: "airplane",
                        message: "Airplane Mode disabled! Please enable Airplane Mode to resume playback.",
                    });
                    releaseWakeLock();

                    toast({
                        title: "⚠️ Airplane Mode Disabled",
                        description: `Playback paused. ${newPausesRemaining} pause(s) remaining.`,
                        variant: "destructive",
                    });
                    return;
                }
            }

            // Check Earphones (if required)
            if (earphoneCheckEnabled) {
                const earphonesConnected = await areEarphonesConnected();
                if (!earphonesConnected) {
                    // Violation detected! Pause and show warning
                    if (audioRef.current) {
                        audioRef.current.pause();
                    }

                    // Reduce pause count for forced pause
                    const newPausesRemaining = Math.max(0, playback.pausesRemaining - 1);

                    setPlayback((prev) => ({
                        ...prev,
                        isPlaying: false,
                        isPaused: true,
                        pausesRemaining: newPausesRemaining,
                    }));
                    setComplianceViolation({
                        type: "earphones",
                        message: "Earphones disconnected! Please reconnect your earphones to resume playback.",
                    });
                    releaseWakeLock();

                    toast({
                        title: "⚠️ Earphones Disconnected",
                        description: `Playback paused. ${newPausesRemaining} pause(s) remaining.`,
                        variant: "destructive",
                    });
                    return;
                }
            }

            // All conditions met - clear any violation
            if (complianceViolation.type) {
                setComplianceViolation({ type: null, message: "" });
            }
        };

        // Run check immediately and then poll every 2 seconds
        if (playback.isPlaying) {
            checkCompliance();
            intervalId = setInterval(checkCompliance, 2000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [playback.isPlaying, playback.pausesRemaining, releaseWakeLock, offlineModeRequired, earphoneCheckEnabled, complianceViolation.type, toast]);

    // Listen for earphone disconnect events (real-time)
    useEffect(() => {
        if (!earphoneCheckEnabled) return;

        const handleDeviceChange = async () => {
            // Only matters if we're playing
            if (!playback.isPlaying) return;

            const isConnected = await areEarphonesConnected();
            if (!isConnected) {
                // Earphones disconnected during playback!
                if (audioRef.current) {
                    audioRef.current.pause();
                }

                const newPausesRemaining = Math.max(0, playback.pausesRemaining - 1);

                setPlayback((prev) => ({
                    ...prev,
                    isPlaying: false,
                    isPaused: true,
                    pausesRemaining: newPausesRemaining,
                }));
                setComplianceViolation({
                    type: "earphones",
                    message: "Earphones disconnected! Please reconnect your earphones to resume playback.",
                });
                releaseWakeLock();

                toast({
                    title: "⚠️ Earphones Disconnected",
                    description: `Playback paused. ${newPausesRemaining} pause(s) remaining.`,
                    variant: "destructive",
                });
            }
        };

        navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
        return () => {
            navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
        };
    }, [playback.isPlaying, playback.pausesRemaining, earphoneCheckEnabled, releaseWakeLock, toast]);

    // Handler to check compliance and resume
    const handleComplianceResume = async () => {
        setIsCheckingCompliance(true);

        try {
            // Check all conditions
            const airplaneOk = !offlineModeRequired || await isAirplaneModeEnabled();
            const earphonesOk = !earphoneCheckEnabled || await areEarphonesConnected();

            if (airplaneOk && earphonesOk) {
                // All conditions met - clear violation and allow resume
                setComplianceViolation({ type: null, message: "" });

                toast({
                    title: "✓ Conditions Met",
                    description: "You can now resume playback.",
                });
            } else {
                // Still not compliant
                if (!airplaneOk) {
                    toast({
                        title: "Airplane Mode Required",
                        description: "Please enable Airplane Mode first.",
                        variant: "destructive",
                    });
                } else if (!earphonesOk) {
                    toast({
                        title: "Earphones Required",
                        description: "Please connect your earphones first.",
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            console.error("Compliance check error:", error);
            toast({
                title: "Check Failed",
                description: "Could not verify device status.",
                variant: "destructive",
            });
        } finally {
            setIsCheckingCompliance(false);
        }
    };

    // Initialize audio from cached URL (already downloaded)
    const initializeDemoAudio = useCallback(async () => {
        if (!cachedAudioUrl) {
            setAudioError("Demo audio not pre-loaded. Please go back and download first.");
            return;
        }

        setIsLoadingAudio(true);
        setAudioError(null);

        try {
            console.log("Using cached audio URL:", cachedAudioUrl);

            // Create audio element with cached blob URL
            const audio = new Audio(cachedAudioUrl);
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
            });

            audio.addEventListener("error", (e) => {
                console.error("Audio playback error:", e);
                setAudioError("Failed to load demo audio. Please go back and re-download.");
                setIsLoadingAudio(false);
            });

            // Preload the audio (should be instant since data is already cached)
            audio.load();

        } catch (err) {
            console.error("Demo audio initialization error:", err);
            const message = err instanceof Error ? err.message : "Failed to initialize demo audio";
            setAudioError(message);
            setIsLoadingAudio(false);
        }
    }, [cachedAudioUrl, releaseWakeLock]);

    // Track if we've already started initialization
    const hasInitialized = useRef(false);

    // Auto-initialize on mount - only once
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;
        initializeDemoAudio();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const togglePlayback = useCallback(async () => {
        if (isComplete || !audioRef.current || audioError) return;

        // Check if pauses remaining (for manual pause)
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

                toast({
                    title: "Paused",
                    description: `${newPausesRemaining} pause(s) remaining.`,
                });
            } else {
                toast({
                    title: "No Pauses Left",
                    description: "You have used all your pauses for this demo.",
                    variant: "destructive",
                });
            }
        } else {
            // Starting/Resuming playback
            await requestWakeLock();

            // Small delay to let the audio system settle
            await new Promise(resolve => setTimeout(resolve, 100));

            audioRef.current?.play()
                .then(() => {
                    setPlayback((prev) => ({
                        ...prev,
                        isPlaying: true,
                        isPaused: false,
                    }));
                })
                .catch((err) => {
                    console.error("Play error:", err);
                    releaseWakeLock();
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
        requestWakeLock,
        releaseWakeLock,
        toast,
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
            <div className="min-h-screen bg-background flex flex-col">
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
                            className="w-full"
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
                {/* Compliance Violation Warning Modal */}
                {complianceViolation.type && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-elevated animate-scale-in">
                            <div className="text-center">
                                <div className={cn(
                                    "inline-flex items-center justify-center h-16 w-16 rounded-full mb-4",
                                    complianceViolation.type === "airplane"
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                )}>
                                    {complianceViolation.type === "airplane" ? (
                                        <Plane className="h-8 w-8" />
                                    ) : (
                                        <Headphones className="h-8 w-8" />
                                    )}
                                </div>

                                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                                    {complianceViolation.type === "airplane"
                                        ? "Airplane Mode Required"
                                        : "Earphones Required"}
                                </h3>

                                <p className="text-muted-foreground text-sm mb-4">
                                    {complianceViolation.message}
                                </p>

                                <div className="bg-destructive/10 rounded-lg px-3 py-2 mb-6">
                                    <p className="text-destructive text-sm font-medium">
                                        ⚠️ Pause count reduced! {playback.pausesRemaining} pause(s) remaining.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {complianceViolation.type === "airplane" && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => openAirplaneModeSettings()}
                                        >
                                            Open Airplane Mode Settings
                                        </Button>
                                    )}

                                    <Button
                                        variant="therapy"
                                        className="w-full"
                                        onClick={handleComplianceResume}
                                        disabled={isCheckingCompliance}
                                    >
                                        {isCheckingCompliance ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Checking...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Check & Resume
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoadingAudio && !audioError && (
                    <div className="mb-8 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-foreground font-medium">Preparing audio...</p>
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
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={onBack}
                        >
                            Go Back & Re-download
                        </Button>
                    </div>
                )}

                {/* Time Display & Controls */}
                {isAudioReady && !isLoadingAudio && !audioError && (
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
                                className="rounded-full"
                                onClick={togglePlayback}
                                disabled={
                                    !!audioError ||
                                    isLoadingAudio ||
                                    (!playback.isPlaying && playback.pausesRemaining === 0 && playback.isPaused) ||
                                    complianceViolation.type !== null
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
                            <Badge
                                variant={playback.pausesRemaining > 0 ? "secondary" : "locked"}
                                className="px-4 py-1.5"
                            >
                                {playback.pausesRemaining} pause{playback.pausesRemaining !== 1 ? "s" : ""} remaining
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
