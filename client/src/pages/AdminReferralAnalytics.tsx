import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    DollarSign,
    TrendingUp,
    Ticket,
    Calendar,
    Eye,
    Download,
    UserCheck,
    Percent,
} from 'lucide-react';
import { referralApi, ReferralAnalyticsItem, ReferredUser } from '@/lib/api';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { toast } from '@/hooks/use-toast';

type FilterPeriod = '1day' | '1week' | '1month' | 'custom' | 'all';

export default function AdminReferralAnalytics() {
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState<ReferralAnalyticsItem[]>([]);
    const [summary, setSummary] = useState({
        totalFacilitators: 0,
        totalReferredUsers: 0,
        totalPaidUsers: 0,
        totalRevenue: 0,
        overallConversionRate: 0,
    });

    // Filter states
    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Drill-down dialog
    const [selectedFacilitator, setSelectedFacilitator] = useState<ReferralAnalyticsItem | null>(null);
    const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
    const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Calculate date range based on filter
    const getDateRange = () => {
        const now = new Date();
        let startDate: string | undefined;
        let endDate: string | undefined;

        switch (filterPeriod) {
            case '1day':
                startDate = startOfDay(subDays(now, 1)).toISOString();
                endDate = endOfDay(now).toISOString();
                break;
            case '1week':
                startDate = startOfDay(subWeeks(now, 1)).toISOString();
                endDate = endOfDay(now).toISOString();
                break;
            case '1month':
                startDate = startOfDay(subMonths(now, 1)).toISOString();
                endDate = endOfDay(now).toISOString();
                break;
            case 'custom':
                if (customStartDate) startDate = startOfDay(new Date(customStartDate)).toISOString();
                if (customEndDate) endDate = endOfDay(new Date(customEndDate)).toISOString();
                break;
            case 'all':
            default:
                // No date filter
                break;
        }

        return { startDate, endDate };
    };

    // Fetch analytics data
    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const { startDate, endDate } = getDateRange();
            const data = await referralApi.getAdminAnalytics({ startDate, endDate });
            setAnalytics(data.analytics);
            setSummary(data.summary);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast({
                title: 'Error',
                description: 'Failed to load referral analytics.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch referred users for a specific facilitator
    const fetchReferredUsers = async (facilitator: ReferralAnalyticsItem) => {
        setSelectedFacilitator(facilitator);
        setIsUsersDialogOpen(true);
        setIsLoadingUsers(true);

        try {
            const { startDate, endDate } = getDateRange();
            const data = await referralApi.getReferredUsersByFacilitator(
                facilitator.facilitatorId,
                { startDate, endDate }
            );
            setReferredUsers(data.users);
        } catch (error) {
            console.error('Failed to fetch referred users:', error);
            toast({
                title: 'Error',
                description: 'Failed to load referred users.',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingUsers(false);
        }
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Facilitator', 'Email', 'Role', 'Referral Codes', 'Referred Users', 'Paid Users', 'Conversion Rate', 'Total Revenue'];
        const rows = analytics.map(a => [
            `${a.firstName} ${a.lastName}`,
            a.email,
            a.role,
            a.totalCodesCreated,
            a.totalReferredUsers,
            a.paidUsers,
            `${a.conversionRate}%`,
            `₹${a.totalRevenue.toFixed(2)}`,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `referral-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    useEffect(() => {
        fetchAnalytics();
    }, [filterPeriod, customStartDate, customEndDate]);

    const getFilterLabel = () => {
        switch (filterPeriod) {
            case '1day': return 'Last 24 Hours';
            case '1week': return 'Last 7 Days';
            case '1month': return 'Last 30 Days';
            case 'custom': return 'Custom Range';
            case 'all': return 'All Time';
            default: return 'All Time';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <AdminSidebar />
                <div className="lg:ml-64">
                    <AdminHeader
                        title="Referral Analytics"
                        subtitle="Track referrals and commissions by facilitator"
                    />
                    <main className="p-4 lg:p-6 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-32" />
                            ))}
                        </div>
                        <Skeleton className="h-96" />
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />

            <div className="lg:ml-64">
                <AdminHeader
                    title="Referral Analytics"
                    subtitle="Track referrals and commissions by facilitator"
                />

                <main className="p-4 lg:p-6 space-y-6 animate-fade-in">
                    {/* Filter Bar */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                                <div className="flex-1 space-y-2">
                                    <Label>Filter Period</Label>
                                    <Select
                                        value={filterPeriod}
                                        onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}
                                    >
                                        <SelectTrigger className="w-full lg:w-48">
                                            <SelectValue placeholder="Select Period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="1day">Last 24 Hours</SelectItem>
                                            <SelectItem value="1week">Last 7 Days</SelectItem>
                                            <SelectItem value="1month">Last 30 Days</SelectItem>
                                            <SelectItem value="custom">Custom Range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {filterPeriod === 'custom' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="w-full lg:w-40"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Input
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="w-full lg:w-40"
                                            />
                                        </div>
                                    </>
                                )}

                                <Button variant="outline" onClick={exportToCSV}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Facilitators
                                </CardTitle>
                                <Users className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary.totalFacilitators}</div>
                                <p className="text-xs text-muted-foreground">With referral codes</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Referred Users
                                </CardTitle>
                                <Ticket className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary.totalReferredUsers}</div>
                                <p className="text-xs text-muted-foreground">{getFilterLabel()}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Paid Users
                                </CardTitle>
                                <UserCheck className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary.totalPaidUsers}</div>
                                <p className="text-xs text-muted-foreground">Converted referrals</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Conversion Rate
                                </CardTitle>
                                <Percent className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary.overallConversionRate}%</div>
                                <p className="text-xs text-muted-foreground">Referral to paid</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Revenue
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{summary.totalRevenue.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">From referred users</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Facilitators Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Referral Performance by Facilitator
                            </CardTitle>
                            <CardDescription>
                                Click "View Details" to see individual referred users
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {analytics.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No referral data found for the selected period.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="text-left py-3 px-4 font-medium text-sm">Facilitator</th>
                                                <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                                                <th className="text-center py-3 px-4 font-medium text-sm">Codes</th>
                                                <th className="text-center py-3 px-4 font-medium text-sm">Referred</th>
                                                <th className="text-center py-3 px-4 font-medium text-sm">Paid</th>
                                                <th className="text-center py-3 px-4 font-medium text-sm">Conversion</th>
                                                <th className="text-right py-3 px-4 font-medium text-sm">Revenue</th>
                                                <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {analytics.map((item) => (
                                                <tr key={item.facilitatorId} className="hover:bg-muted/30 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div>
                                                            <p className="font-medium">{item.firstName} {item.lastName}</p>
                                                            <p className="text-sm text-muted-foreground">{item.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Badge variant="secondary" className="capitalize">
                                                            {item.role.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary text-sm font-medium">
                                                            {item.totalCodesCreated}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                                            {item.totalReferredUsers}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                            {item.paidUsers}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <Badge
                                                            variant={item.conversionRate >= 50 ? 'active' : item.conversionRate >= 25 ? 'default' : 'secondary'}
                                                        >
                                                            {item.conversionRate}%
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                            ₹{item.totalRevenue.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => fetchReferredUsers(item)}
                                                            disabled={item.totalReferredUsers === 0}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Referred Users Dialog */}
            <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Referred Users by {selectedFacilitator?.firstName} {selectedFacilitator?.lastName}
                        </DialogTitle>
                    </DialogHeader>

                    {isLoadingUsers ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16" />
                            ))}
                        </div>
                    ) : referredUsers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No referred users found for the selected period.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left py-3 px-4 font-medium text-sm">User</th>
                                        <th className="text-left py-3 px-4 font-medium text-sm">Referral Code</th>
                                        <th className="text-left py-3 px-4 font-medium text-sm">Registered</th>
                                        <th className="text-center py-3 px-4 font-medium text-sm">Status</th>
                                        <th className="text-right py-3 px-4 font-medium text-sm">Amount Paid</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {referredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-mono font-bold text-primary">{user.referralCode}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                        {user.codeDescription}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm">
                                                    {user.registeredAt && !isNaN(new Date(user.registeredAt).getTime())
                                                        ? format(new Date(user.registeredAt), 'MMM d, yyyy')
                                                        : '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {user.registeredAt && !isNaN(new Date(user.registeredAt).getTime())
                                                        ? format(new Date(user.registeredAt), 'h:mm a')
                                                        : ''}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <Badge variant={user.hasPaid ? 'active' : 'secondary'}>
                                                    {user.hasPaid ? 'Paid' : 'Not Paid'}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                {user.hasPaid ? (
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                        ₹{user.totalPaid.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Summary row */}
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="text-sm text-muted-foreground">Total Users: </span>
                                    <span className="font-semibold">{referredUsers.length}</span>
                                    <span className="mx-3 text-muted-foreground">|</span>
                                    <span className="text-sm text-muted-foreground">Paid: </span>
                                    <span className="font-semibold text-green-600">
                                        {referredUsers.filter(u => u.hasPaid).length}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Total Revenue: </span>
                                    <span className="font-bold text-lg text-emerald-600">
                                        ₹{referredUsers.reduce((sum, u) => sum + u.totalPaid, 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
