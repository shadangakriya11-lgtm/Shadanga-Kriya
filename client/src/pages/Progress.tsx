import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LearnerHeader } from '@/components/learner/LearnerHeader';
import { BottomNav } from '@/components/learner/BottomNav';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  Clock,
  Lock,
  TrendingUp,
  CreditCard,
  Calendar,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useMyEnrollments, useMyPayments, useMyProgress } from '@/hooks/useApi';

export default function Progress() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('progress');

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useMyEnrollments();
  const { data: paymentsData, isLoading: paymentsLoading } = useMyPayments();
  const { data: progressData, isLoading: progressLoading } = useMyProgress();

  const enrollments = enrollmentsData?.enrollments || [];
  const payments = paymentsData?.payments || [];

  const totalLessons = progressData?.totalLessons || 0;
  const completedLessons = progressData?.completedLessons || 0;
  const activeLessons = progressData?.inProgressLessons || 0;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const isLoading = enrollmentsLoading || paymentsLoading || progressLoading;

  return (
    <div className="min-h-screen bg-background pb-20">
      <LearnerHeader userName={user ? `${user.firstName} ${user.lastName}` : 'User'} />

      <main className="px-4 py-6 max-w-3xl mx-auto">
        {/* Header */}
        <section className="mb-8 animate-fade-in">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Your Progress
          </h1>
          <p className="text-muted-foreground">
            Track your therapy journey and payment history
          </p>
        </section>

        {/* Overall Stats */}
        <section className="grid grid-cols-3 gap-3 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
            <TrendingUp className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{isLoading ? '-' : `${overallProgress}%`}</p>
            <p className="text-xs text-muted-foreground">Overall</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
            <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{isLoading ? '-' : completedLessons}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
            <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{isLoading ? '-' : activeLessons}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="progress" className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
          </TabsList>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            {isLoading ? (
              <>
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
              </>
            ) : enrollments.length > 0 ? (
              enrollments.map((enrollment: any, index: number) => (
                <div
                  key={enrollment.id}
                  className="bg-card rounded-xl border border-border/50 p-5 shadow-soft animate-fade-in cursor-pointer hover:shadow-card transition-shadow"
                  style={{ animationDelay: `${(index + 2) * 100}ms` }}
                  onClick={() => navigate(`/course/${enrollment.courseId}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
                        {enrollment.courseTitle || 'Course'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={enrollment.category === 'meditation' ? 'self' : 'onsite'}>
                          {enrollment.category || 'Therapy'}
                        </Badge>
                        <Badge variant={enrollment.status === 'completed' ? 'completed' : 'active'}>
                          {enrollment.status === 'completed' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {enrollment.completedLessons || 0} of {enrollment.totalLessons || 0} lessons
                      </span>
                      <span className="font-semibold text-foreground">{enrollment.progressPercent || 0}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          (enrollment.progressPercent || 0) === 100
                            ? "bg-success"
                            : "bg-gradient-to-r from-primary to-success"
                        )}
                        style={{ width: `${enrollment.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No enrolled courses yet</p>
              </div>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-card rounded-xl border border-border/50 p-5 shadow-soft animate-fade-in">
              <h3 className="font-medium text-foreground mb-3">Payment Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{payments.length}</p>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {isLoading ? (
              <>
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </>
            ) : payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment: any, index: number) => (
                  <div
                    key={payment.id}
                    className="bg-card rounded-xl border border-border/50 p-4 shadow-soft animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">{payment.courseTitle || 'Course'}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">₹{payment.amount}</p>
                        <Badge variant={payment.status === 'completed' ? 'completed' : 'pending'} className="mt-1">
                          {payment.status === 'completed' ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/50 mt-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Transaction ID:</span> {payment.transaction_id || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Method:</span> {payment.payment_method || 'Online'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No payment history yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
