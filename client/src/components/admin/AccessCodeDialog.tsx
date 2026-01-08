import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    KeyRound,
    Clock,
    Shield,
    RefreshCw,
    Copy,
    Check,
    AlertTriangle,
    Infinity,
} from "lucide-react";
import {
    useAccessCodeInfo,
    useGenerateAccessCode,
    useToggleAccessCode,
    useClearAccessCode,
} from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";

interface AccessCodeDialogProps {
    lessonId: string;
    lessonTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AccessCodeDialog({
    lessonId,
    lessonTitle,
    open,
    onOpenChange,
}: AccessCodeDialogProps) {
    const [codeType, setCodeType] = useState<"permanent" | "temporary">("permanent");
    const [expiresInMinutes, setExpiresInMinutes] = useState(60);
    const [copied, setCopied] = useState(false);

    const { data: codeInfo, isLoading } = useAccessCodeInfo(open ? lessonId : "");
    const generateCode = useGenerateAccessCode();
    const toggleCode = useToggleAccessCode();
    const clearCode = useClearAccessCode();

    // Reset copied state
    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleCopyCode = async () => {
        if (codeInfo?.accessCode?.code) {
            await navigator.clipboard.writeText(codeInfo.accessCode.code);
            setCopied(true);
            toast({ title: "Access code copied to clipboard!" });
        }
    };

    const handleGenerateCode = async () => {
        await generateCode.mutateAsync({
            lessonId,
            codeType,
            expiresInMinutes: codeType === "temporary" ? expiresInMinutes : undefined,
        });
    };

    const handleToggleCode = async () => {
        await toggleCode.mutateAsync({
            lessonId,
            enabled: !codeInfo?.accessCodeEnabled,
        });
    };

    const handleClearCode = async () => {
        await clearCode.mutateAsync(lessonId);
    };

    const formatExpiry = (expiresAt: string | null) => {
        if (!expiresAt) return null;
        const expiry = new Date(expiresAt);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) return "Expired";

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h remaining`;
        if (hours > 0) return `${hours}h ${minutes % 60}m remaining`;
        return `${minutes}m remaining`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        Access Code Management
                    </DialogTitle>
                    <DialogDescription className="truncate">
                        {lessonTitle}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Access Code Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium">Require Access Code</p>
                                    <p className="text-sm text-muted-foreground">
                                        Learners must enter code to start
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={codeInfo?.accessCodeEnabled || false}
                                onCheckedChange={handleToggleCode}
                                disabled={toggleCode.isPending}
                            />
                        </div>

                        {/* Current Access Code Display */}
                        {codeInfo?.hasAccessCode && codeInfo.accessCode && (
                            <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Current Access Code
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={codeInfo.accessCode.type === "permanent" ? "default" : "secondary"}
                                        >
                                            {codeInfo.accessCode.type === "permanent" ? (
                                                <span className="flex items-center gap-1">
                                                    <Infinity className="h-3 w-3" />
                                                    Permanent
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Temporary
                                                </span>
                                            )}
                                        </Badge>
                                        {codeInfo.accessCode.isExpired && (
                                            <Badge variant="destructive">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Expired
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1 font-mono text-3xl font-bold tracking-[0.3em] text-center py-3 bg-background rounded-lg border">
                                        {codeInfo.accessCode.code}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCopyCode}
                                        className="h-12 w-12"
                                    >
                                        {copied ? (
                                            <Check className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Copy className="h-5 w-5" />
                                        )}
                                    </Button>
                                </div>

                                {codeInfo.accessCode.type === "temporary" && codeInfo.accessCode.expiresAt && (
                                    <p
                                        className={`text-sm mt-2 text-center ${codeInfo.accessCode.isExpired ? "text-destructive" : "text-muted-foreground"
                                            }`}
                                    >
                                        {codeInfo.accessCode.isExpired ? (
                                            <span className="flex items-center justify-center gap-1">
                                                <AlertTriangle className="h-4 w-4" />
                                                Code has expired. Generate a new one.
                                            </span>
                                        ) : (
                                            formatExpiry(codeInfo.accessCode.expiresAt)
                                        )}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Generate New Access Code */}
                        <div className="space-y-4 p-4 rounded-lg border">
                            <h4 className="font-medium">
                                {codeInfo?.hasAccessCode ? "Regenerate Access Code" : "Generate Access Code"}
                            </h4>

                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label>Code Type</Label>
                                    <Select
                                        value={codeType}
                                        onValueChange={(v) => setCodeType(v as "permanent" | "temporary")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="permanent">
                                                <span className="flex items-center gap-2">
                                                    <Infinity className="h-4 w-4" />
                                                    Permanent (Never Expires)
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="temporary">
                                                <span className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    Temporary (Auto-Expires)
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {codeType === "temporary" && (
                                    <div className="space-y-2">
                                        <Label>Expires In (minutes)</Label>
                                        <div className="flex gap-2">
                                            {[30, 60, 120, 1440].map((mins) => (
                                                <Button
                                                    key={mins}
                                                    type="button"
                                                    variant={expiresInMinutes === mins ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setExpiresInMinutes(mins)}
                                                    className="flex-1"
                                                >
                                                    {mins < 60
                                                        ? `${mins}m`
                                                        : mins < 1440
                                                            ? `${mins / 60}h`
                                                            : "1d"}
                                                </Button>
                                            ))}
                                        </div>
                                        <Input
                                            type="number"
                                            value={expiresInMinutes}
                                            onChange={(e) =>
                                                setExpiresInMinutes(Math.max(1, parseInt(e.target.value) || 60))
                                            }
                                            min={1}
                                            className="mt-2"
                                            placeholder="Custom minutes"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="premium"
                                    className="flex-1"
                                    onClick={handleGenerateCode}
                                    disabled={generateCode.isPending}
                                >
                                    {generateCode.isPending ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                    )}
                                    {codeInfo?.hasAccessCode ? "Regenerate" : "Generate"}
                                </Button>
                                {codeInfo?.hasAccessCode && (
                                    <Button
                                        variant="outline"
                                        onClick={handleClearCode}
                                        disabled={clearCode.isPending}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
