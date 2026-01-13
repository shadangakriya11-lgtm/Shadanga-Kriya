import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { referralApi } from "@/lib/api";
import { ReferralCode } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Loader2, Copy, Ticket } from "lucide-react";
import { format } from "date-fns";
import { FacilitatorSidebar } from "@/components/facilitator/FacilitatorSidebar";
import { FacilitatorHeader } from "@/components/facilitator/FacilitatorHeader";

export default function FacilitatorReferrals() {
    const [codes, setCodes] = useState<ReferralCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [description, setDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchCodes();
    }, []);

    const fetchCodes = async () => {
        try {
            const data = await referralApi.getMyCodes();
            setCodes(data);
        } catch (error) {
            console.error("Failed to fetch codes:", error);
            toast({
                title: "Error",
                description: "Failed to load referral codes.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setIsGenerating(true);
        try {
            const { referralCode } = await referralApi.generate(description);
            setCodes([referralCode, ...codes]);
            setDescription("");
            toast({
                title: "Success",
                description: `Referral code ${referralCode.code} generated successfully!`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to generate code.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            const { isActive } = await referralApi.toggleStatus(id);
            setCodes(codes.map(c => c.id === id ? { ...c, isActive } : c));
            toast({
                title: "Status Updated",
                description: `Referral code is now ${isActive ? 'active' : 'inactive'}.`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive",
            });
        }
    };

    const copyToClipboard = (code: number) => {
        navigator.clipboard.writeText(code.toString());
        toast({
            title: "Copied!",
            description: "Referral code copied to clipboard.",
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="hidden lg:block"><FacilitatorSidebar /></div>
            <div className="lg:ml-64">
                <FacilitatorHeader
                    title="Referral Codes"
                    subtitle="Generate and manage unique referral codes for your practitioners."
                />

                <main className="p-4 lg:p-6 space-y-6 animate-fade-in">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Generator Card */}
                        <Card className="md:col-span-2 lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Ticket className="h-5 w-5 text-primary" />
                                    Generate New Code
                                </CardTitle>
                                <CardDescription>
                                    Create a unique integer code for a new group or campaign.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleGenerate} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description / Reference Name</label>
                                        <Input
                                            placeholder="e.g. Yoga Batch June 2024"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            disabled={isGenerating}
                                        />
                                    </div>
                                    <Button type="submit" disabled={!description.trim() || isGenerating}>
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            "Generate Code"
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Stats Card or Info - Placeholder */}
                        <Card className="md:col-span-2 lg:col-span-1 bg-primary/5 border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-primary">How it works</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1. Generate a unique numerical code for your students.</p>
                                <p>2. Share the code with your group.</p>
                                <p>3. When students register, they enter this code.</p>
                                <p>4. You can track who registered using "Use Count".</p>
                                <p>5. Disable codes when a batch is full or closed.</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Codes List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Codes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : codes.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    You haven't created any referral codes yet.
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50 text-sm">
                                        <div className="col-span-2 md:col-span-2">Code</div>
                                        <div className="col-span-4 md:col-span-4">Description</div>
                                        <div className="col-span-2 md:col-span-2 text-center">Uses</div>
                                        <div className="col-span-2 md:col-span-2 text-center">Status</div>
                                        <div className="col-span-2 md:col-span-2 text-right">Actions</div>
                                    </div>
                                    <div className="divide-y">
                                        {codes.map((code) => (
                                            <div key={code.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm">
                                                <div className="col-span-2 font-mono font-bold text-lg text-primary flex items-center gap-2">
                                                    {code.code}
                                                    <button
                                                        onClick={() => copyToClipboard(code.code)}
                                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                                        title="Copy code"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="col-span-4">
                                                    <div className="font-medium truncate" title={code.description}>{code.description}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {code.createdAt && !isNaN(new Date(code.createdAt).getTime())
                                                            ? format(new Date(code.createdAt), "MMM d, yyyy")
                                                            : "—"}
                                                    </div>
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-secondary text-xs font-medium">
                                                        {code.useCount || 0}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${code.isActive
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                        }`}>
                                                        {code.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleStatus(code.id)}
                                                        className={code.isActive ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                                    >
                                                        {code.isActive ? "Deactivate" : "Activate"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
