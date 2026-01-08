import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Loader2 } from 'lucide-react';
import { useUsers, useEnrollmentsByCourse, useAdminEnroll, useAdminUnenroll } from '@/hooks/useApi';

interface CoursePermissionDialogProps {
    courseId: string;
    courseTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CoursePermissionDialog({
    courseId,
    courseTitle,
    open,
    onOpenChange,
}: CoursePermissionDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all learners
    const { data: usersData, isLoading: usersLoading } = useUsers({ role: 'learner' });

    // Fetch current enrollments for this course
    const { data: enrollmentsData, isLoading: enrollmentsLoading, refetch: refetchEnrollments } = useEnrollmentsByCourse(
        open ? courseId : ''
    );

    const adminEnroll = useAdminEnroll();
    const adminUnenroll = useAdminUnenroll();

    // Refetch enrollments when dialog opens
    useEffect(() => {
        if (open && courseId) {
            refetchEnrollments();
        }
    }, [open, courseId, refetchEnrollments]);

    // Get all learners
    const learners = (usersData?.users || []).filter((user: any) =>
        user.role === 'learner' &&
        (user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Get enrolled user IDs
    const enrolledUserIds = new Set(
        (enrollmentsData?.enrollments || []).map((e: any) => e.userId)
    );

    // Sort learners: enrolled first, then alphabetically
    const sortedLearners = [...learners].sort((a: any, b: any) => {
        const aEnrolled = enrolledUserIds.has(a.id);
        const bEnrolled = enrolledUserIds.has(b.id);
        if (aEnrolled && !bEnrolled) return -1;
        if (!aEnrolled && bEnrolled) return 1;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

    const handleToggleAccess = async (userId: string, currentlyEnrolled: boolean) => {
        try {
            if (currentlyEnrolled) {
                await adminUnenroll.mutateAsync({ userId, courseId });
            } else {
                await adminEnroll.mutateAsync({ userId, courseId });
            }
        } catch (error) {
            console.error('Failed to toggle access:', error);
        }
    };

    const isLoading = usersLoading || enrollmentsLoading;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] sm:max-h-[85vh] flex flex-col p-4 sm:p-6">
                <DialogHeader className="space-y-1.5 pb-2">
                    <DialogTitle className="font-serif flex items-center gap-2 text-base sm:text-lg">
                        <Users className="h-5 w-5 text-primary" />
                        Manage Course Access
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Grant or revoke access to <span className="font-medium text-foreground">{courseTitle}</span>
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search learners..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                    <Badge variant="active">{enrolledUserIds.size} enrolled</Badge>
                    <span>•</span>
                    <span>{sortedLearners.length} learners{searchQuery ? ' found' : ' total'}</span>
                </div>

                {/* Learners List - Using native overflow for better mobile touch support */}
                <div className="flex-1 min-h-0 overflow-y-auto -mx-4 px-4 sm:-mx-6 sm:px-6" style={{ maxHeight: 'calc(90vh - 220px)' }}>
                    {isLoading ? (
                        <div className="space-y-3 py-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div>
                                            <Skeleton className="h-4 w-32 mb-1" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-11 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : sortedLearners.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No learners found</p>
                            {searchQuery && (
                                <p className="text-sm">Try a different search term</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2 py-2">
                            {sortedLearners.map((user: any) => {
                                const isEnrolled = enrolledUserIds.has(user.id);
                                const isPending =
                                    (adminEnroll.isPending && adminEnroll.variables?.userId === user.id) ||
                                    (adminUnenroll.isPending && adminUnenroll.variables?.userId === user.id);

                                return (
                                    <div
                                        key={user.id}
                                        className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-colors ${isEnrolled
                                            ? 'bg-primary/5 border-primary/20'
                                            : 'bg-card border-border/50 hover:bg-muted/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-medium text-primary">
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-foreground truncate text-sm sm:text-base">
                                                    {user.firstName} {user.lastName}
                                                </p>
                                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Larger touch target for mobile */}
                                        <div
                                            className="flex-shrink-0 p-2 -m-2 touch-manipulation"
                                            onClick={(e) => {
                                                // Prevent event bubbling issues on mobile
                                                e.stopPropagation();
                                            }}
                                        >
                                            {isPending ? (
                                                <div className="h-6 w-11 flex items-center justify-center">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                </div>
                                            ) : (
                                                <Switch
                                                    checked={isEnrolled}
                                                    disabled={isPending}
                                                    onCheckedChange={() => handleToggleAccess(user.id, isEnrolled)}
                                                    className="touch-manipulation"
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

