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
import { Search, Users } from 'lucide-react';
import { useUsers, useEnrollmentsByCourse, useAdminEnroll, useAdminUnenroll } from '@/hooks/useApi';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    const { data: enrollmentsData, isLoading: enrollmentsLoading } = useEnrollmentsByCourse(
        open ? courseId : ''
    );

    const adminEnroll = useAdminEnroll();
    const adminUnenroll = useAdminUnenroll();

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
            <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-serif flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Manage Course Access
                    </DialogTitle>
                    <DialogDescription>
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
                        className="pl-9"
                    />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="active">{enrolledUserIds.size} enrolled</Badge>
                    <span>•</span>
                    <span>{learners.length} learners total</span>
                </div>

                {/* Learners List */}
                <ScrollArea className="flex-1 min-h-0 max-h-[400px] pr-4">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div>
                                            <Skeleton className="h-4 w-32 mb-1" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-10 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : learners.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No learners found</p>
                            {searchQuery && (
                                <p className="text-sm">Try a different search term</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {learners.map((user: any) => {
                                const isEnrolled = enrolledUserIds.has(user.id);
                                const isPending =
                                    (adminEnroll.isPending && adminEnroll.variables?.userId === user.id) ||
                                    (adminUnenroll.isPending && adminUnenroll.variables?.userId === user.id);

                                return (
                                    <div
                                        key={user.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isEnrolled
                                                ? 'bg-primary/5 border-primary/20'
                                                : 'bg-card border-border/50 hover:bg-muted/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-medium text-primary">
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground truncate">
                                                    {user.firstName} {user.lastName}
                                                </p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={isEnrolled}
                                            disabled={isPending}
                                            onCheckedChange={() => handleToggleAccess(user.id, isEnrolled)}
                                            className="flex-shrink-0"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
