import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LearnerHeader } from '@/components/learner/LearnerHeader';
import { BottomNav } from '@/components/learner/BottomNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockCourses, mockLessons } from '@/data/mockData';
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

// Mock payment history
const paymentHistory = [
  {
    id: 'pay1',
    courseName: 'Foundations of Mindful Breathing',
    amount: 149,
    date: new Date('2024-12-15'),
    status: 'completed',
    method: 'Razorpay',
    transactionId: 'pay_OxYZ123abc456',
  },
  {
    id: 'pay2',
    courseName: 'Sleep Restoration Program',
    amount: 99,
    date: new Date('2024-11-20'),
    status: 'completed',
    method: 'Razorpay',
    transactionId: 'pay_OwXY789def012',
  },
];

export default function Progress() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('progress');

  const totalLessons = mockLessons.length;
  const completedLessons = mockLessons.filter(l => l.status === 'completed').length;
  const activeLessons = mockLessons.filter(l => l.status === 'active').length;
  const overallProgress = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="min-h-screen bg-background pb-20">
      <LearnerHeader userName="Sarah Mitchell" />
      
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
            <p className="text-2xl font-bold text-foreground">{overallProgress}%</p>
            <p className="text-xs text-muted-foreground">Overall</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
            <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{completedLessons}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
            <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{activeLessons}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="progress" className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
          </TabsList>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            {/* Course Progress Cards */}
            {mockCourses.filter(c => c.status !== 'locked').map((course, index) => (
              <div
                key={course.id}
                className="bg-card rounded-xl border border-border/50 p-5 shadow-soft animate-fade-in cursor-pointer hover:shadow-card transition-shadow"
                style={{ animationDelay: `${(index + 2) * 100}ms` }}
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.type === 'self' ? 'self' : 'onsite'}>
                        {course.type === 'self' ? 'Self-Paced' : 'On-Site'}
                      </Badge>
                      <Badge variant={course.status === 'completed' ? 'completed' : 'active'}>
                        {course.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {course.completedLessons} of {course.totalLessons} lessons
                    </span>
                    <span className="font-semibold text-foreground">{course.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        course.progress === 100
                          ? "bg-success"
                          : "bg-gradient-to-r from-primary to-success"
                      )}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Lesson Timeline Preview */}
                <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
                  {mockLessons.filter(l => l.courseId === course.id).map((lesson, i) => (
                    <div
                      key={lesson.id}
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                        lesson.status === 'completed' && "bg-success/15 text-success",
                        lesson.status === 'active' && "bg-primary text-primary-foreground",
                        lesson.status === 'locked' && "bg-muted text-muted-foreground"
                      )}
                      title={lesson.title}
                    >
                      {lesson.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : lesson.status === 'locked' ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        i + 1
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-card rounded-xl border border-border/50 p-5 shadow-soft animate-fade-in">
              <h3 className="font-medium text-foreground mb-3">Payment Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{paymentHistory.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{paymentHistory.length}</p>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-3">
              {paymentHistory.map((payment, index) => (
                <div
                  key={payment.id}
                  className="bg-card rounded-xl border border-border/50 p-4 shadow-soft animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">{payment.courseName}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{payment.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{payment.amount}</p>
                      <Badge variant="completed" className="mt-1">Paid</Badge>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50 mt-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Transaction ID:</span> {payment.transactionId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Method:</span> {payment.method}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {paymentHistory.length === 0 && (
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
