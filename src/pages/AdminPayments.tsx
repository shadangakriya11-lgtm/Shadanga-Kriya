import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { mockCourses, mockUsers } from '@/data/mockData';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  createdAt: Date;
}

const mockTransactions: Transaction[] = [
  {
    id: 't1',
    userId: 'u1',
    userName: 'Sarah Mitchell',
    userEmail: 'sarah.m@example.com',
    courseId: '1',
    courseTitle: 'Foundations of Mindful Breathing',
    amount: 149,
    status: 'completed',
    paymentMethod: 'Razorpay',
    transactionId: 'pay_OxY123456789',
    createdAt: new Date('2024-12-26T14:30:00'),
  },
  {
    id: 't2',
    userId: 'u2',
    userName: 'James Chen',
    userEmail: 'james.chen@example.com',
    courseId: '2',
    courseTitle: 'Stress Response Protocol',
    amount: 99,
    status: 'pending',
    paymentMethod: 'Razorpay',
    transactionId: 'pay_OxY987654321',
    createdAt: new Date('2024-12-27T09:15:00'),
  },
  {
    id: 't3',
    userId: 'u1',
    userName: 'Sarah Mitchell',
    userEmail: 'sarah.m@example.com',
    courseId: '3',
    courseTitle: 'Guided Recovery Sessions',
    amount: 299,
    status: 'completed',
    paymentMethod: 'Razorpay',
    transactionId: 'pay_OxY111222333',
    createdAt: new Date('2024-12-24T11:00:00'),
  },
];

const transactionColumns = [
  {
    key: 'user',
    header: 'User',
    render: (tx: Transaction) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
          {tx.userName.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="font-medium text-foreground">{tx.userName}</p>
          <p className="text-sm text-muted-foreground">{tx.userEmail}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'course',
    header: 'Course',
    render: (tx: Transaction) => (
      <p className="font-medium text-foreground">{tx.courseTitle}</p>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    render: (tx: Transaction) => (
      <span className="font-semibold text-foreground">${tx.amount}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (tx: Transaction) => {
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
          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
        </Badge>
      );
    },
  },
  {
    key: 'transactionId',
    header: 'Transaction ID',
    render: (tx: Transaction) => (
      <code className="text-xs bg-muted px-2 py-1 rounded">{tx.transactionId}</code>
    ),
  },
  {
    key: 'date',
    header: 'Date',
    render: (tx: Transaction) => (
      <span className="text-muted-foreground">
        {tx.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    render: (tx: Transaction) => (
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
            <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
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

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isActivateOpen, setIsActivateOpen] = useState(false);

  const filteredTransactions = mockTransactions.filter((tx) =>
    tx.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = mockTransactions
    .filter(tx => tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64">
        <AdminHeader title="Payments & Transactions" subtitle="Manage payments and course activations" />
        
        <main className="p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Dialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
                <DialogTrigger asChild>
                  <Button variant="premium">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manual Activation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif">Manual Course Activation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>User</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCourses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Input placeholder="e.g., Scholarship, Promotional access" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setIsActivateOpen(false)}>Cancel</Button>
                      <Button variant="premium" onClick={() => setIsActivateOpen(false)}>Activate Course</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="font-serif text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-serif text-2xl font-bold text-success">
                {mockTransactions.filter(tx => tx.status === 'completed').length}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="font-serif text-2xl font-bold text-warning">
                {mockTransactions.filter(tx => tx.status === 'pending').length}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="font-serif text-2xl font-bold text-foreground">$12,450</p>
            </div>
          </div>

          {/* Transactions Table */}
          <DataTable columns={transactionColumns} data={filteredTransactions} />
        </main>
      </div>
    </div>
  );
}
