import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, MoreHorizontal, Download, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllPayments, usePaymentStats, useUsers, useCourses, useCompletePayment, useActivateCourse } from '@/hooks/useApi';

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [activateData, setActivateData] = useState({ userId: '', courseId: '', notes: '' });

  const { data: paymentsData, isLoading } = useAllPayments();
  const { data: statsData } = usePaymentStats();
  const { data: usersData } = useUsers();
  const { data: coursesData } = useCourses();
  const completePayment = useCompletePayment();
  const activateCourse = useActivateCourse();

  const payments = (paymentsData?.payments || []).filter((payment: any) =>
    payment.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = statsData || { totalRevenue: 0, completed: 0, pending: 0, revenueThisMonth: 0 };
  const users = usersData?.users || [];
  const courses = coursesData?.courses || [];

  const handleCompletePayment = async (paymentId: string) => {
    try {
      await completePayment.mutateAsync(paymentId);
    } catch (error) {
      console.error('Failed to complete payment:', error);
    }
  };

  const handleActivate = async () => {
    try {
      await activateCourse.mutateAsync(activateData);
      setIsActivateOpen(false);
      setActivateData({ userId: '', courseId: '', notes: '' });
    } catch (error) {
      console.error('Failed to activate course:', error);
    }
  };

  const transactionColumns = [
    {
      key: 'user',
      header: 'User',
      render: (tx: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {(tx.userName || tx.userEmail || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{tx.userName || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">{tx.userEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      render: (tx: any) => (
        <p className="font-medium text-foreground">{tx.courseTitle || 'Unknown Course'}</p>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx: any) => (
        <span className="font-semibold text-foreground">${tx.amount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (tx: any) => {
        const variants: Record<string, 'active' | 'completed' | 'pending' | 'locked'> = {
          completed: 'completed',
          pending: 'pending',
          failed: 'locked',
          refunded: 'locked',
        };
        const icons: Record<string, React.ReactNode> = {
          completed: <CheckCircle className="h-3 w-3" />,
          pending: <Clock className="h-3 w-3" />,
          failed: <XCircle className="h-3 w-3" />,
          refunded: <XCircle className="h-3 w-3" />,
        };
        return (
          <Badge variant={variants[tx.status]} className="gap-1">
            {icons[tx.status]}
            {tx.status?.charAt(0).toUpperCase() + tx.status?.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'transactionId',
      header: 'Transaction ID',
      render: (tx: any) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{tx.transactionId || 'N/A'}</code>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (tx: any) => (
        <span className="text-muted-foreground">
          {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (tx: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Send Receipt</DropdownMenuItem>
            {tx.status === 'pending' && (
              <DropdownMenuItem onClick={() => handleCompletePayment(tx.id)}>
                Mark as Completed
              </DropdownMenuItem>
            )}
            {tx.status === 'completed' && (
              <DropdownMenuItem className="text-destructive">Process Refund</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:ml-64">
          <AdminHeader title="Payments & Transactions" subtitle="Manage payments and course activations" />
          <main className="p-4 lg:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminHeader title="Payments & Transactions" subtitle="Manage payments and course activations" />

        <main className="p-4 lg:p-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 lg:w-80 pl-9"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
                <DialogTrigger asChild>
                  <Button variant="premium" className="w-full sm:w-auto">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manual Activation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-serif">Manual Course Activation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>User</Label>
                      <Select value={activateData.userId} onValueChange={(val) => setActivateData({ ...activateData, userId: val })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select value={activateData.courseId} onValueChange={(val) => setActivateData({ ...activateData, courseId: val })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course: any) => (
                            <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Input
                        placeholder="e.g., Scholarship, Promotional access"
                        value={activateData.notes}
                        onChange={(e) => setActivateData({ ...activateData, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setIsActivateOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                      <Button variant="premium" onClick={handleActivate} className="w-full sm:w-auto" disabled={activateCourse.isPending}>
                        {activateCourse.isPending ? 'Activating...' : 'Activate Course'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Total Revenue</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">${stats.totalRevenue?.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Completed</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-success">{stats.completed}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Pending</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-warning">{stats.pending}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">This Month</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">${stats.revenueThisMonth?.toLocaleString()}</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <DataTable columns={transactionColumns} data={payments} />
          </div>
        </main>
      </div>
    </div>
  );
}
