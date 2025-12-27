import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LearnerHeader } from '@/components/learner/LearnerHeader';
import { BottomNav } from '@/components/learner/BottomNav';
import { CourseCard } from '@/components/learner/CourseCard';
import { PaymentModal } from '@/components/learner/PaymentModal';
import { mockCourses } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { Course } from '@/types';

export default function LearnerHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const activeCourses = mockCourses.filter((c) => c.status === 'active' || c.status === 'pending');
  const completedCourses = mockCourses.filter((c) => c.status === 'completed');
  const lockedCourses = mockCourses.filter((c) => c.status === 'locked');

  const filteredCourses = activeTab === 'all' 
    ? mockCourses 
    : activeTab === 'active' 
    ? activeCourses 
    : completedCourses;

  const handleCourseClick = (course: Course) => {
    if (course.status === 'locked' && course.price) {
      // Open payment modal for locked courses with a price
      setSelectedCourse(course);
      setIsPaymentOpen(true);
    } else {
      navigate(`/course/${course.id}`);
    }
  };

  const handlePaymentSuccess = (courseId: string) => {
    // In production, this would update the course status in the database
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <LearnerHeader userName="Sarah Mitchell" />
      
      <main className="px-4 py-6 max-w-3xl mx-auto">
        {/* Welcome Section */}
        <section className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Your Therapy Journey
          </h1>
          <p className="text-muted-foreground">
            Continue your path to wellness with structured, protocol-driven sessions.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
            <BookOpen className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{activeCourses.length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
            <Clock className="h-5 w-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{lockedCourses.length}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center shadow-soft">
            <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{completedCourses.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </section>

        {/* Courses Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="all" className="flex-1">All Courses</TabsTrigger>
            <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => handleCourseClick(course)}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No courses found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />

      {/* Payment Modal */}
      <PaymentModal
        course={selectedCourse}
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
