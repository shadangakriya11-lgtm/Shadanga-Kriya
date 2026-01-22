import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    Download,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { demoApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DemoDownloadProps {
    onComplete: (audioBlobUrl: string) => void;
    onBack: () => void;
}

export function DemoDownload({ onComplete, onBack }: DemoDownloadProps) {
    const { toast } = useToast();

    const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "complete" | "error">("idle");
    const [loadingProgress, setLoadingProgress] = useState<{
        loaded: number;
        total: number;
        percent: number;
    }>({
        loaded: 0,
        total: 0,
        percent: 0,
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const audioBlobUrlRef = useRef<string | null>(null);
    const hasStarted = useRef(false);

    // Format bytes to human readable size
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 MB";
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    // Download the demo audio
    const downloadAudio = useCallback(async () => {
        if (downloadState === "downloading") return;

        setDownloadState("downloading");
        setErrorMessage(null);
        setLoadingProgress({ loaded: 0, total: 0, percent: 0 });

        try {
            // Get demo audio info from backend
            const audioInfo = await demoApi.getAudioInfo();

            if (!audioInfo.audioUrl) {
                throw new Error("Demo audio not configured yet. Please contact support.");
            }

            console.log("Demo audio URL:", audioInfo.audioUrl);

            // Use XMLHttpRequest for better progress tracking
            const audioBlob = await new Promise<Blob>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", audioInfo.audioUrl, true);
                xhr.responseType = "blob";

                // Required for ngrok free tier to skip browser warning
                xhr.setRequestHeader("ngrok-skip-browser-warning", "true");

                // Expected file size (fallback): ~54MB
                const expectedSize = 56274000;

                xhr.onloadstart = () => {
                    console.log("Download started...");
                    setLoadingProgress({
                        loaded: 0,
                        total: expectedSize,
                        percent: 1,
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
                        percent: Math.min(Math.max(percent, 1), 100),
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
                    reject(new Error("Network error. Please check your internet connection."));
                };

                xhr.ontimeout = () => {
                    console.error("XHR timeout");
                    reject(new Error("Download timed out. Please try again."));
                };

                console.log("Starting download from:", audioInfo.audioUrl);
                xhr.send();
            });

            console.log("Audio blob created, size:", audioBlob.size);

            // Create object URL from blob
            const audioUrl = URL.createObjectURL(audioBlob);
            audioBlobUrlRef.current = audioUrl;

            setDownloadState("complete");

            toast({
                title: "✓ Download Complete",
                description: "Demo audio is ready. You can now enable Airplane Mode.",
            });

        } catch (err) {
            console.error("Demo audio download error:", err);
            const message = err instanceof Error ? err.message : "Failed to download demo audio";
            setErrorMessage(message);
            setDownloadState("error");

            toast({
                title: "Download Failed",
                description: message,
                variant: "destructive",
            });
        }
    }, [downloadState, toast]);

    // Auto-start download on mount
    useEffect(() => {
        if (hasStarted.current) return;
        hasStarted.current = true;
        downloadAudio();
    }, [downloadAudio]);

    // Handle continue to protocol
    const handleContinue = () => {
        if (audioBlobUrlRef.current) {
            onComplete(audioBlobUrlRef.current);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <div className="flex items-center gap-4 px-4 py-4 max-w-2xl mx-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        disabled={downloadState === "downloading"}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Step 1 of 2
                        </p>
                        <h1 className="font-serif text-lg font-semibold truncate">
                            Preparing Demo Audio
                        </h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="px-4 py-8 max-w-2xl mx-auto">
                {/* Introduction */}
                <div className="text-center mb-8">
                    <div className={cn(
                        "inline-flex items-center justify-center h-20 w-20 rounded-full mb-6",
                        downloadState === "complete"
                            ? "bg-success/15 text-success"
                            : downloadState === "error"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-primary/10 text-primary"
                    )}>
                        {downloadState === "complete" ? (
                            <CheckCircle2 className="h-10 w-10" />
                        ) : downloadState === "error" ? (
                            <AlertTriangle className="h-10 w-10" />
                        ) : downloadState === "downloading" ? (
                            <Loader2 className="h-10 w-10 animate-spin" />
                        ) : (
                            <Download className="h-10 w-10" />
                        )}
                    </div>

                    <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
                        {downloadState === "complete"
                            ? "✓ Download Complete!"
                            : downloadState === "error"
                                ? "Download Failed"
                                : "Downloading Demo Audio"}
                    </h2>

                    <p className="text-muted-foreground max-w-md mx-auto">
                        {downloadState === "complete"
                            ? "Demo audio is cached and ready. You can now proceed to enable Airplane Mode for a distraction-free experience."
                            : downloadState === "error"
                                ? errorMessage
                                : "Please wait while we download the demo audio. Keep your internet connection active."}
                    </p>
                </div>

                {/* Progress Section */}
                {downloadState === "downloading" && (
                    <div className="mb-8">
                        {/* Circular Progress Indicator */}
                        <div className="flex justify-center mb-6">
                            <div className="relative inline-flex items-center justify-center h-32 w-32">
                                {/* Background circle */}
                                <svg className="absolute h-32 w-32 -rotate-90" viewBox="0 0 100 100">
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
                                <span className="text-3xl font-bold text-primary">
                                    {loadingProgress.percent}%
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-muted/30 rounded-full h-3 mb-4 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-300"
                                style={{ width: `${loadingProgress.percent}%` }}
                            />
                        </div>

                        {/* Size info */}
                        <div className="text-center">
                            {loadingProgress.total > 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {formatBytes(loadingProgress.loaded)} / {formatBytes(loadingProgress.total)}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                    <Wifi className="h-4 w-4 animate-pulse" />
                                    Connecting to server...
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {downloadState === "complete" && (
                    <Button
                        variant="therapy"
                        size="xl"
                        className="w-full"
                        onClick={handleContinue}
                    >
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Continue
                    </Button>
                )}

                {downloadState === "error" && (
                    <div className="space-y-3">
                        <Button
                            variant="therapy"
                            size="xl"
                            className="w-full"
                            onClick={() => {
                                hasStarted.current = false;
                                downloadAudio();
                            }}
                        >
                            <RefreshCw className="h-5 w-5 mr-2" />
                            Retry Download
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full"
                            onClick={onBack}
                        >
                            Go Back
                        </Button>
                    </div>
                )}

                {downloadState === "downloading" && (
                    <p className="text-center text-sm text-muted-foreground">
                        Please keep the app open and stay connected to the internet...
                    </p>
                )}
            </main>
        </div>
    );
}
