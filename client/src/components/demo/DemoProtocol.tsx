import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Plane,
    Headphones,
    Brain,
    ChevronLeft,
    Play,
    Shield,
    RefreshCw,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    isAirplaneModeEnabled,
    areEarphonesConnected,
    onNetworkStatusChange,
    openAirplaneModeSettings,
    getAirplaneModeInstructions,
} from "@/lib/deviceChecks";
import { useToast } from "@/hooks/use-toast";
import { usePlaybackSettings } from "@/hooks/useApi";

interface DemoProtocolProps {
    onBack: () => void;
    onStart: () => void;
}

interface ChecklistState {
    flightModeEnabled: boolean;
    earbudsConnected: boolean;
    focusAcknowledged: boolean;
}

const checklistItems = [
    {
        id: "flightModeEnabled" as keyof ChecklistState,
        icon: Plane,
        title: "Flight Mode Enabled",
        titleHi: "एरोप्लेन मोड चालू करें",
        description: "Enable airplane mode to prevent interruptions during your session.",
        descriptionHi: "अपने सत्र के दौरान बाधाओं को रोकने के लिए एरोप्लेन मोड चालू करें।",
    },
    {
        id: "earbudsConnected" as keyof ChecklistState,
        icon: Headphones,
        title: "Earphones Connected",
        titleHi: "इयरफ़ोन कनेक्ट करें",
        description: "Use quality earphones or headphones for optimal audio experience.",
        descriptionHi: "बेहतर ऑडियो अनुभव के लिए अच्छी गुणवत्ता वाले इयरफ़ोन का उपयोग करें।",
    },
    {
        id: "focusAcknowledged" as keyof ChecklistState,
        icon: Brain,
        title: "Focus Commitment",
        titleHi: "पूर्ण ध्यान की प्रतिबद्धता",
        description: "I am in a quiet space and ready to focus completely on this session.",
        descriptionHi: "मैं एक शांत स्थान पर हूँ और इस सत्र पर पूरी तरह ध्यान देने के लिए तैयार हूँ।",
    },
];

export function DemoProtocol({ onBack, onStart }: DemoProtocolProps) {
    const { toast } = useToast();
    const { data: playbackSettings } = usePlaybackSettings();

    // Get settings with defaults - checks are enabled unless admin disables them
    const flightModeCheckEnabled = playbackSettings?.flightModeCheckEnabled ?? true;
    const earphoneCheckEnabled = playbackSettings?.earphoneCheckEnabled ?? true;

    const [checklist, setChecklist] = useState<ChecklistState>({
        flightModeEnabled: !flightModeCheckEnabled, // Auto-checked if disabled
        earbudsConnected: !earphoneCheckEnabled,   // Auto-checked if disabled
        focusAcknowledged: false,
    });

    const [isCheckingDevices, setIsCheckingDevices] = useState(false);
    const [autoCheckResults, setAutoCheckResults] = useState<{
        airplaneMode: boolean | null;
        earphones: boolean | null;
    }>({
        airplaneMode: null,
        earphones: null,
    });

    const allChecked = Object.values(checklist).every(Boolean);

    // Update checklist when settings change
    useEffect(() => {
        setChecklist((prev) => ({
            ...prev,
            flightModeEnabled: !flightModeCheckEnabled ? true : prev.flightModeEnabled,
            earbudsConnected: !earphoneCheckEnabled ? true : prev.earbudsConnected,
        }));
    }, [flightModeCheckEnabled, earphoneCheckEnabled]);

    // Auto-check device status on mount
    useEffect(() => {
        checkDeviceStatus();

        // Monitor network status for airplane mode changes
        if (!flightModeCheckEnabled) return;

        const cleanup = onNetworkStatusChange((isConnected) => {
            setAutoCheckResults((prev) => ({
                ...prev,
                airplaneMode: !isConnected,
            }));

            if (!isConnected) {
                setChecklist((prev) => ({ ...prev, flightModeEnabled: true }));
                toast({
                    title: "Airplane mode detected",
                    description: "Flight mode is now enabled",
                });
            } else {
                setChecklist((prev) => ({ ...prev, flightModeEnabled: false }));
                toast({
                    title: "Network detected",
                    description: "Please enable airplane mode for optimal experience",
                    variant: "destructive",
                });
            }
        });

        return cleanup;
    }, [toast, flightModeCheckEnabled]);

    const checkDeviceStatus = async () => {
        setIsCheckingDevices(true);
        try {
            const [airplaneMode, earphones] = await Promise.all([
                flightModeCheckEnabled ? isAirplaneModeEnabled() : Promise.resolve(true),
                earphoneCheckEnabled ? areEarphonesConnected() : Promise.resolve(true),
            ]);

            setAutoCheckResults({
                airplaneMode: flightModeCheckEnabled ? airplaneMode : null,
                earphones: earphoneCheckEnabled ? earphones : null,
            });

            if (airplaneMode) {
                setChecklist((prev) => ({ ...prev, flightModeEnabled: true }));
            }

            if (earphones) {
                setChecklist((prev) => ({ ...prev, earbudsConnected: true }));
                if (earphoneCheckEnabled) {
                    toast({
                        title: "Earphones detected",
                        description: "Audio device is connected",
                    });
                }
            }
        } catch (error) {
            console.error("Error checking device status:", error);
            toast({
                title: "Auto-check failed",
                description: "Please manually confirm the checklist items",
                variant: "destructive",
            });
        } finally {
            setIsCheckingDevices(false);
        }
    };

    const toggleItem = (id: keyof ChecklistState) => {
        setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAirplaneModeHelp = () => {
        const instructions = getAirplaneModeInstructions();
        toast({
            title: "Enable Airplane Mode",
            description: instructions,
            duration: 5000,
        });
        openAirplaneModeSettings();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <div className="flex items-center gap-4 px-4 py-4 max-w-2xl mx-auto">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Pre-Session Protocol
                        </p>
                        <h1 className="font-serif text-lg font-semibold">Demo Meditation</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="px-4 py-8 max-w-2xl mx-auto">
                {/* Introduction */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 text-primary mb-4">
                        <Shield className="h-8 w-8" />
                    </div>
                    <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
                        अपना वातावरण तैयार करें
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">
                        सर्वोत्तम ध्यान अनुभव के लिए, कृपया नीचे दी गई शर्तों को पूरा करें।
                    </p>

                    {/* Auto-check button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={checkDeviceStatus}
                        disabled={isCheckingDevices}
                        className="gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isCheckingDevices && "animate-spin")} />
                        {isCheckingDevices ? "Checking..." : "Auto-check Device"}
                    </Button>
                </div>

                {/* Checklist */}
                <div className="space-y-4 mb-10">
                    {checklistItems
                        .filter((item) => {
                            if (item.id === "flightModeEnabled" && !flightModeCheckEnabled) return false;
                            if (item.id === "earbudsConnected" && !earphoneCheckEnabled) return false;
                            return true;
                        })
                        .map((item, index) => {
                            const Icon = item.icon;
                            const isChecked = checklist[item.id];
                            const autoCheckStatus =
                                item.id === "flightModeEnabled"
                                    ? autoCheckResults.airplaneMode
                                    : item.id === "earbudsConnected"
                                        ? autoCheckResults.earphones
                                        : null;

                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex items-start gap-4 p-5 rounded-xl border transition-all duration-300 cursor-pointer animate-fade-in relative",
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
                                            isChecked
                                                ? "bg-success/15 text-success"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-foreground">{item.titleHi}</h3>
                                            {autoCheckStatus !== null && (
                                                <span
                                                    className={cn(
                                                        "text-xs px-2 py-0.5 rounded-full",
                                                        autoCheckStatus
                                                            ? "bg-success/20 text-success"
                                                            : "bg-destructive/20 text-destructive"
                                                    )}
                                                >
                                                    {autoCheckStatus ? "✓ Detected" : "✗ Not detected"}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{item.descriptionHi}</p>
                                        {item.id === "flightModeEnabled" && !isChecked && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2 h-7 text-xs gap-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAirplaneModeHelp();
                                                }}
                                            >
                                                <Settings className="h-3 w-3" />
                                                How to enable
                                            </Button>
                                        )}
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
                            <span className="font-medium">~45 minutes</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Playback</span>
                            <span className="font-medium">One-time only</span>
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <Button
                    variant={allChecked ? "therapy" : "locked"}
                    size="xl"
                    className={cn(
                        "w-full",
                        allChecked && "bg-gradient-to-r from-primary to-primary/80 shadow-lg"
                    )}
                    disabled={!allChecked}
                    onClick={onStart}
                >
                    <Play className="h-5 w-5 mr-2" />
                    {allChecked ? "▶ Demo Meditation शुरू करें" : "Complete Checklist to Continue"}
                </Button>

                {!allChecked && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        कृपया आगे बढ़ने के लिए ऊपर सभी items की पुष्टि करें
                    </p>
                )}
            </main>
        </div>
    );
}
