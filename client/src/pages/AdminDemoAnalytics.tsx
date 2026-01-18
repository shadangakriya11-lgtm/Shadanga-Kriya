import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Headphones,
    Users,
    CheckCircle2,
    SkipForward,
    Clock,
    Search,
    Eye,
    TrendingUp,
    FileQuestion,
    RefreshCw,
} from "lucide-react";
import { useDemoAnalytics } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

// Question text mapping for displaying actual questions
const questionTextMap: Record<string, string> = {
    question1: "क्या आप खुद को ऐसा व्यक्ति बनते देखना चाहते हैं जो तनाव में भी शांत और संतुलित रहता हो?",
    question2: "अगर तनाव और बेचैनी ऐसे ही बनी रही, तो इसका सबसे ज़्यादा असर किस पर पड़ेगा?",
    question3: "क्या आपने कभी महसूस किया है कि सही मार्गदर्शन मिलने पर ध्यान आपके लिए आसान हो सकता है?",
    question4: "अगर एक अनुभव सिर्फ चुनिंदा लोगों के लिए हो और सामान्य कंटेंट से अलग हो, तो क्या आप उसे आज़माना चाहेंगे?",
    question5: "क्या आप अपने मन की शांति के लिए समय और ऊर्जा निवेश करने को तैयार हैं?",
};

// Answer label mapping for displaying readable answers in Hindi
const answerLabelMap: Record<string, string> = {
    // Question 1
    yes: "हाँ, बिल्कुल",
    sometimes: "कभी-कभी",
    not_sure: "अभी निश्चित नहीं",
    // Question 2
    health: "मेरी सेहत",
    career: "मेरा काम / करियर",
    relationships: "मेरे रिश्ते",
    sleep: "मेरी नींद",
    confidence: "मेरा आत्मविश्वास",
    // Question 3
    need_guidance: "हाँ, मार्गदर्शन की ज़रूरत है",
    difficult_alone: "अकेले करना मुश्किल लगता है",
    not_found: "अभी तक सही तरीका नहीं मिला",
    // Question 4
    understand_first: "पहले समझना चाहूँगा/चाहूँगी",
    maybe: "शायद",
    // Question 5
    yes_now: "हाँ, अभी",
    soon: "जल्द ही",
    not_now: "अभी नहीं",
};

export default function AdminDemoAnalytics() {
    const { data: analytics, isLoading, refetch, isRefetching } = useDemoAnalytics();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Filter responses by search
    const filteredResponses = analytics?.recentResponses?.filter(
        (r: any) =>
            r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];


    const stats = [
        {
            title: "Total Watched",
            value: analytics?.stats?.totalWatched || 0,
            icon: CheckCircle2,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            title: "Total Skipped",
            value: analytics?.stats?.totalSkipped || 0,
            icon: SkipForward,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
        },
        {
            title: "Pending",
            value: analytics?.stats?.pending || 0,
            icon: Clock,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            title: "Completion Rate",
            value: analytics?.stats?.completionRate || "0%",
            icon: TrendingUp,
            color: "text-primary",
            bgColor: "bg-primary/10",
        },
    ];

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <div className="lg:ml-64">
                <AdminHeader title="Demo Analytics" subtitle="Track demo meditation engagement" />
                <main className="p-6 lg:p-8">
                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="font-serif text-3xl font-bold text-foreground flex items-center gap-3">
                                <Headphones className="h-8 w-8 text-primary" />
                                Demo Analytics
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Track demo meditation engagement and questionnaire responses
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            disabled={isRefetching}
                        >
                            <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {isLoading ? (
                            Array(4).fill(0).map((_, i) => (
                                <Card key={i}>
                                    <CardContent className="pt-6">
                                        <Skeleton className="h-12 w-full" />
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            stats.map((stat, i) => (
                                <Card key={i} className="relative overflow-hidden">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">{stat.value}</p>
                                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Questionnaire Responses */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileQuestion className="h-5 w-5 text-primary" />
                                        Questionnaire Responses
                                    </CardTitle>
                                    <CardDescription>
                                        View individual user responses to demo priming questions
                                    </CardDescription>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {Array(5).fill(0).map((_, i) => (
                                        <Skeleton key={i} className="h-14 w-full" />
                                    ))}
                                </div>
                            ) : filteredResponses.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium">No questionnaire responses yet</p>
                                    <p className="text-sm">Responses will appear here as users complete the demo questionnaire.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead>Questions</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredResponses.map((response: any) => (
                                                <TableRow key={response.id}>
                                                    <TableCell className="font-medium">
                                                        {response.name}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {response.email}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">
                                                            {formatDate(response.createdAt)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {response.responses ? Object.keys(response.responses).length : 0} responses
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedUser(response)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Response Detail Dialog */}
                    <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    {selectedUser?.name}'s Responses
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedUser?.email} • Submitted {selectedUser && formatDate(selectedUser.createdAt)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                {selectedUser?.responses && Object.entries(selectedUser.responses).map(([questionId, answer], i) => (
                                    <div key={questionId} className="p-4 rounded-lg bg-muted/50 border">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">
                                            प्रश्न {i + 1}
                                        </p>
                                        <p className="font-medium mb-3 text-foreground">
                                            {questionTextMap[questionId] || questionId}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                                {answerLabelMap[String(answer)] || String(answer)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}

                                {(!selectedUser?.responses || Object.keys(selectedUser.responses).length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>No response data available</p>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    );
}
