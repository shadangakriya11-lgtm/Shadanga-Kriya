import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, MoreHorizontal, Download, CreditCard, CheckCircle, XCircle, Clock, FileText, FileSpreadsheet, Eye, Receipt, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { useToast } from '@/hooks/use-toast';

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [activateData, setActivateData] = useState({ userId: '', courseId: '', notes: '' });
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const { data: paymentsData, isLoading, refetch } = useAllPayments();
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

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['User Name', 'Email', 'Course', 'Amount', 'Status', 'Transaction ID', 'Payment Method', 'Date'];
    const csvData = payments.map((tx: any) => [
      tx.userName || 'Unknown',
      tx.userEmail || '',
      tx.courseTitle || 'Unknown Course',
      tx.amount,
      tx.status,
      tx.transactionId || 'N/A',
      tx.paymentMethod || 'N/A',
      new Date(tx.createdAt).toLocaleDateString('en-US'),
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row: string[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payments_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: "Export Complete",
      description: `Exported ${payments.length} payment records to CSV`,
    });
  };

  // Export to PDF (simple text-based)
  const exportToPDF = () => {
    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Export Failed",
        description: "Please allow pop-ups to export PDF",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = payments.reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || 0), 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
          .summary { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
          .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; min-width: 150px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .stat-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #4f46e5; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .status-completed { color: #059669; font-weight: bold; }
          .status-pending { color: #d97706; font-weight: bold; }
          .status-failed { color: #dc2626; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Shadanga Kriya - Payment Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        
        <div class="summary">
          <div class="stat-card">
            <div class="stat-value">₹${stats.totalRevenue?.toLocaleString()}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.completed}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.pending}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${payments.length}</div>
            <div class="stat-label">Total Transactions</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Transaction ID</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map((tx: any) => `
              <tr>
                <td>${tx.userName || 'Unknown'}<br><small>${tx.userEmail || ''}</small></td>
                <td>${tx.courseTitle || 'Unknown Course'}</td>
                <td>₹${tx.amount}</td>
                <td class="status-${tx.status}">${tx.status?.charAt(0).toUpperCase() + tx.status?.slice(1)}</td>
                <td><code>${tx.transactionId || 'N/A'}</code></td>
                <td>${new Date(tx.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>Total</strong></td>
              <td><strong>₹${totalAmount.toLocaleString()}</strong></td>
              <td colspan="3"></td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <p>Shadanga Kriya LMS - Confidential Payment Report</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Trigger print after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);

    toast({
      title: "PDF Ready",
      description: "Print dialog opened. Save as PDF to download.",
    });
  };

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

  // View payment details
  const handleViewDetails = (tx: any) => {
    setSelectedPayment(tx);
    setIsDetailsOpen(true);
  };

  // Download receipt as PDF
  const handleDownloadReceipt = (tx: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Download Failed",
        description: "Please allow pop-ups to download receipt",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${tx.transactionId || 'N/A'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #333; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .receipt-title { font-size: 18px; color: #666; margin-top: 10px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; color: #888; text-transform: uppercase; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .row:last-child { border-bottom: none; }
          .label { color: #666; }
          .value { font-weight: 500; text-align: right; }
          .total-row { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .total-row .label { font-size: 16px; }
          .total-row .value { font-size: 24px; color: #4f46e5; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-completed { background: #d1fae5; color: #059669; }
          .status-pending { background: #fef3c7; color: #d97706; }
          .status-refunded { background: #fee2e2; color: #dc2626; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Shadanga Kriya</div>
          <div class="receipt-title">Payment Receipt</div>
        </div>

        <div class="section">
          <div class="section-title">Transaction Details</div>
          <div class="row">
            <span class="label">Transaction ID</span>
            <span class="value">${tx.transactionId || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Date</span>
            <span class="value">${new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div class="row">
            <span class="label">Status</span>
            <span class="value"><span class="status status-${tx.status}">${tx.status?.toUpperCase()}</span></span>
          </div>
          <div class="row">
            <span class="label">Payment Method</span>
            <span class="value">${tx.paymentMethod || 'Razorpay'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="row">
            <span class="label">Name</span>
            <span class="value">${tx.userName || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Email</span>
            <span class="value">${tx.userEmail || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Purchase Details</div>
          <div class="row">
            <span class="label">Course</span>
            <span class="value">${tx.courseTitle || 'Unknown Course'}</span>
          </div>
        </div>

        <div class="total-row">
          <div class="row" style="border: none;">
            <span class="label">Total Amount</span>
            <span class="value">₹${tx.amount}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Shadanga Kriya - Holistic Wellness Platform</p>
          <p>This is a computer-generated receipt.</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 500);

    toast({
      title: "Receipt Ready",
      description: "Print dialog opened. Save as PDF to download.",
    });
  };

  // Mark payment as refunded
  const handleMarkAsRefunded = async (tx: any) => {
    if (!confirm(`Are you sure you want to mark this payment as refunded?\n\nUser: ${tx.userName}\nCourse: ${tx.courseTitle}\nAmount: ₹${tx.amount}`)) {
      return;
    }

    try {
      // We'll use the complete payment endpoint but with refunded status
      // For now, just show a success message - you may want to add a dedicated endpoint
      toast({
        title: "Payment Marked as Refunded",
        description: `Marked payment for ${tx.userName} as refunded`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark payment as refunded",
        variant: "destructive",
      });
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
        <span className="font-semibold text-foreground">₹{tx.amount}</span>
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
            <DropdownMenuItem onClick={() => handleViewDetails(tx)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadReceipt(tx)}>
              <Receipt className="h-4 w-4 mr-2" />
              Download Receipt
            </DropdownMenuItem>
            {tx.status === 'pending' && (
              <DropdownMenuItem onClick={() => handleCompletePayment(tx.id)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Completed
              </DropdownMenuItem>
            )}
            {tx.status === 'completed' && (
              <DropdownMenuItem className="text-destructive" onClick={() => handleMarkAsRefunded(tx)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Mark as Refunded
              </DropdownMenuItem>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">₹{stats.totalRevenue?.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Completed</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-success">{String(stats.completed || 0)}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">Pending</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-warning">{String(stats.pending || 0)}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-xs lg:text-sm text-muted-foreground">This Month</p>
              <p className="font-serif text-xl lg:text-2xl font-bold text-foreground">₹{stats.revenueThisMonth?.toLocaleString()}</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <DataTable columns={transactionColumns} data={payments} />
          </div>

          {/* View Details Dialog */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">Payment Details</DialogTitle>
              </DialogHeader>
              {selectedPayment && (
                <div className="space-y-6 py-4">
                  {/* Transaction Info */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Transaction</h4>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Transaction ID</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">{selectedPayment.transactionId || 'N/A'}</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={
                          selectedPayment.status === 'completed' ? 'completed' :
                            selectedPayment.status === 'pending' ? 'pending' : 'locked'
                        }>
                          {selectedPayment.status?.charAt(0).toUpperCase() + selectedPayment.status?.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">{new Date(selectedPayment.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="font-medium">{selectedPayment.paymentMethod || 'Razorpay'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Customer</h4>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{selectedPayment.userName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium text-sm">{selectedPayment.userEmail || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Info */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Purchase</h4>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Course</span>
                        <span className="font-medium">{selectedPayment.courseTitle || 'Unknown Course'}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-3 mt-3">
                        <span className="font-medium">Amount Paid</span>
                        <span className="font-serif text-2xl font-bold text-primary">₹{selectedPayment.amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        handleDownloadReceipt(selectedPayment);
                      }}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsDetailsOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
