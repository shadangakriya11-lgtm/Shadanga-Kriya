import { FacilitatorSidebar } from '@/components/facilitator/FacilitatorSidebar';
import { FacilitatorHeader } from '@/components/facilitator/FacilitatorHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Users, Play, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '@/hooks/useApi';

export default function FacilitatorCourses() {
    const navigate = useNavigate();
    const { data, isLoading } = useCourses();
    const courses = data?.courses || [];

    return (
        <div className="min-h-screen bg-background">
            <div className="hidden lg:block">
                <FacilitatorSidebar />
            </div>

            <div className="lg:ml-64">
                <FacilitatorHeader title="Assigned Courses" subtitle="Manage and monitor your assigned therapeutic courses" />

                <main className="p-4 lg:p-6">
                    {isLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-64 rounded-xl" />
                            ))}
                        </div>
                    ) : courses.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-20 text-center">
                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-medium">No courses assigned</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                    You don't have any courses assigned to you yet. Contact the administrator to get started.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {courses.map((course: any) => (
                                <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                                    <div className="aspect-video bg-muted relative">
                                        {course.image_url ? (
                                            <img
                                                src={course.image_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                <BookOpen className="h-12 w-12 text-primary/20" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                                                {course.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="font-serif text-xl line-clamp-1">{course.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                            {course.description}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {course.lessonCount || 0} Lessons
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />
                                                {course.enrollment_count || 0} Learners
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="premium"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => navigate(`/facilitator/sessions?courseId=${course.id}`)}
                                            >
                                                <Play className="h-3.5 w-3.5 mr-1.5" />
                                                Sessions
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => navigate(`/facilitator/monitoring?courseId=${course.id}`)}
                                            >
                                                <Users className="h-3.5 w-3.5 mr-1.5" />
                                                Monitor
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
