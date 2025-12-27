import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockCourses, mockLessons } from '@/data/mockData';
import { LessonCard } from '@/components/learner/LessonCard';
import { PreLessonProtocol } from '@/components/learner/PreLessonProtocol';
import { AudioPlayer } from '@/components/learner/AudioPlayer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, BookOpen, DollarSign } from 'lucide-react';
import { Lesson } from '@/types';

type ViewState = 'details' | 'protocol' | 'player';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('details');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const course = mockCourses.find((c) => c.id === id);
  const lessons = mockLessons.filter((l) => l.courseId === id);

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.status === 'active') {
      setSelectedLesson(lesson);
      setView('protocol');
    }
  };

  const handleStartSession = () => {
    setView('player');
  };

  const handleComplete = () => {
    setView('details');
    setSelectedLesson(null);
  };

  if (view === 'protocol' && selectedLesson) {
    return (
      <PreLessonProtocol
        lesson={selectedLesson}
        onBack={() => setView('details')}
        onStart={handleStartSession}
      />
    );
  }

  if (view === 'player' && selectedLesson) {
    return (
      <AudioPlayer
        lesson={selectedLesson}
        onBack={() => setView('protocol')}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-4 px-4 py-4 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Course Details</p>
            <h1 className="font-serif text-lg font-semibold truncate">{course.title}</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-3xl mx-auto">
        {/* Course Info */}
        <section className="mb-8 animate-fade-in">
          <div className="flex gap-2 mb-4">
            <Badge variant={course.type === 'self' ? 'self' : 'onsite'}>
              {course.type === 'self' ? 'Self-Paced' : 'On-Site'}
            </Badge>
            <Badge variant={course.status === 'active' ? 'active' : course.status === 'completed' ? 'completed' : 'locked'}>
              {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
            </Badge>
          </div>

          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
            {course.title}
          </h2>
          <p className="text-muted-foreground mb-6">
            {course.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>{course.totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
            {course.price && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                <span>${course.price}</span>
              </div>
            )}
          </div>
        </section>

        {/* Progress */}
        {course.status !== 'locked' && (
          <section className="mb-8 bg-card rounded-xl border border-border/50 p-5 shadow-soft animate-fade-in animate-delay-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">Your Progress</h3>
              <span className="font-semibold text-primary">{course.progress}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {course.completedLessons} of {course.totalLessons} lessons completed
            </p>
          </section>
        )}

        {/* Lessons */}
        <section className="animate-fade-in animate-delay-200">
          <h3 className="font-serif text-xl font-semibold text-foreground mb-4">
            Lessons
          </h3>
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onClick={() => handleLessonClick(lesson)}
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${(index + 3) * 100}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
