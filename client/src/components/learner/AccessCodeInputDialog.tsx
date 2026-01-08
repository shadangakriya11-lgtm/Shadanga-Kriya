import { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useVerifyAccessCode } from "@/hooks/useApi";

interface AccessCodeInputDialogProps {
    lessonId: string;
    lessonTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVerified: () => void;
}

export function AccessCodeInputDialog({
    lessonId,
    lessonTitle,
    open,
    onOpenChange,
    onVerified,
}: AccessCodeInputDialogProps) {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const verifyCode = useVerifyAccessCode();

    // Focus first input on open
    useEffect(() => {
        if (open) {
            setCode(["", "", "", "", "", ""]);
            setError(null);
            setIsVerified(false);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [open]);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        const digit = value.replace(/\D/g, "").slice(-1);

        const newCode = [...code];
        newCode[index] = digit;
        setCode(newCode);
        setError(null);

        // Auto-focus next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits entered
        if (digit && index === 5) {
            const fullCode = newCode.join("");
            if (fullCode.length === 6) {
                handleVerify(fullCode);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

        if (pastedData.length > 0) {
            const newCode = [...code];
            for (let i = 0; i < 6; i++) {
                newCode[i] = pastedData[i] || "";
            }
            setCode(newCode);

            // Focus the next empty input or last input
            const nextEmptyIndex = newCode.findIndex((d) => !d);
            if (nextEmptyIndex !== -1) {
                inputRefs.current[nextEmptyIndex]?.focus();
            } else {
                inputRefs.current[5]?.focus();
                // Auto-submit
                if (pastedData.length === 6) {
                    handleVerify(pastedData);
                }
            }
        }
    };

    const handleVerify = async (codeStr?: string) => {
        const accessCode = codeStr || code.join("");

        if (accessCode.length !== 6) {
            setError("Please enter a valid 6-digit access code");
            return;
        }

        try {
            const result = await verifyCode.mutateAsync({ lessonId, code: accessCode });

            if (result.valid) {
                setIsVerified(true);
                setTimeout(() => {
                    onVerified();
                    onOpenChange(false);
                }, 800);
            } else {
                setError(result.error || "Invalid access code");
                setCode(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch {
            setError("Invalid access code. Please try again.");
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[340px] sm:max-w-sm mx-4">
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        {isVerified ? (
                            <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-green-500" />
                        ) : (
                            <KeyRound className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                        )}
                    </div>
                    <DialogTitle className="font-serif text-center text-lg">
                        {isVerified ? "Access Granted!" : "Enter Access Code"}
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm">
                        {isVerified ? (
                            "Starting your lesson..."
                        ) : (
                            <>
                                Enter the 6-digit code to start
                                <br />
                                <span className="font-medium text-foreground line-clamp-1">{lessonTitle}</span>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {!isVerified && (
                    <div className="space-y-5 pt-2">
                        {/* Access Code Input Grid */}
                        <div className="flex justify-center gap-1.5 sm:gap-2">
                            {code.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    className={`w-10 h-12 sm:w-11 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold p-0 ${error
                                        ? "border-destructive focus:ring-destructive"
                                        : digit
                                            ? "border-primary"
                                            : ""
                                        }`}
                                    disabled={verifyCode.isPending}
                                />
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        {/* Verify Button */}
                        <Button
                            variant="premium"
                            className="w-full"
                            onClick={() => handleVerify()}
                            disabled={code.join("").length !== 6 || verifyCode.isPending}
                        >
                            {verifyCode.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Verify Access Code"
                            )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            Contact your facilitator or admin if you don't have the access code
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
