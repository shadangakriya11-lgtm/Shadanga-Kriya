import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Play, Shield, Clock, MapPin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoConfirmationProps {
    onConfirm: () => void;
    onBack: () => void;
    onSkip: () => void;
}

const conditions = [
    {
        id: "time",
        icon: Clock,
        title: "45 मिनट का समय",
        description: "मैं अगले 45 मिनट तक किसी बाधा के बिना बैठ सकता/सकती हूँ",
    },
    {
        id: "space",
        icon: MapPin,
        title: "शांत स्थान",
        description: "मैं शांत और सुरक्षित स्थान पर हूँ",
    },
    {
        id: "oneTime",
        icon: AlertCircle,
        title: "एक बार का अनुभव",
        description: "मैं समझता/समझती हूँ कि यह Demo केवल एक बार चलेगा",
    },
];

export function DemoConfirmation({ onConfirm, onBack, onSkip }: DemoConfirmationProps) {
    const [checklist, setChecklist] = useState<Record<string, boolean>>({
        time: false,
        space: false,
        oneTime: false,
    });

    const allChecked = Object.values(checklist).every(Boolean);

    const toggleItem = (id: string) => {
        setChecklist((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50">
                <div className="flex items-center gap-4 px-4 py-4 max-w-2xl mx-auto">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            🎧 Demo Meditation Gate
                        </p>
                        <h1 className="font-serif text-lg font-semibold">तैयारी की पुष्टि</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
                {/* Intro Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 text-primary mb-4 shadow-lg">
                        <Shield className="h-10 w-10" />
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-4 leading-relaxed">
                        अब हम आपको एक विशेष <br className="hidden sm:block" />
                        <span className="text-primary">Demo Meditation</span> देने जा रहे हैं।
                    </h2>
                    <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
                        यह केवल अनुभव के लिए नहीं, बल्कि <strong>परिवर्तन की शुरुआत</strong> के लिए है।
                    </p>
                </div>

                {/* Confirmation Text */}
                <p className="text-center text-sm text-muted-foreground mb-6">
                    कृपया पुष्टि करें:
                </p>

                {/* Conditions Checklist */}
                <div className="space-y-4 mb-8">
                    {conditions.map((condition, index) => {
                        const Icon = condition.icon;
                        const isChecked = checklist[condition.id];

                        return (
                            <div
                                key={condition.id}
                                className={cn(
                                    "flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer animate-fade-in",
                                    isChecked
                                        ? "bg-success/5 border-success/30 shadow-md"
                                        : "bg-card border-border/50 hover:border-primary/30"
                                )}
                                style={{ animationDelay: `${index * 100}ms` }}
                                onClick={() => toggleItem(condition.id)}
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
                                    <h3 className="font-medium text-foreground mb-1">
                                        {condition.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {condition.description}
                                    </p>
                                </div>
                                <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggleItem(condition.id)}
                                    className="mt-1 h-6 w-6 rounded-md"
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Important Note */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
                    <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                महत्वपूर्ण सूचना
                            </p>
                            <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                                यह Demo Meditation केवल <strong>एक बार</strong> सुना जा सकता है।
                                कृपया सुनिश्चित करें कि आप पूरी तरह तैयार हैं।
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    variant={allChecked ? "therapy" : "locked"}
                    size="xl"
                    className={cn(
                        "w-full",
                        allChecked && "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    )}
                    disabled={!allChecked}
                    onClick={onConfirm}
                >
                    <Play className="h-5 w-5 mr-2" />
                    {allChecked ? "Demo Meditation शुरू करें" : "कृपया सभी पुष्टि करें"}
                </Button>

                {!allChecked && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        आगे बढ़ने के लिए ऊपर सभी items पर check करें
                    </p>
                )}

                {/* Skip option */}
                <Button
                    variant="link"
                    onClick={onSkip}
                    className="mt-6 w-full text-muted-foreground hover:text-foreground"
                >
                    Demo छोड़ें
                </Button>
            </main>
        </div>
    );
}
