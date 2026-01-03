import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCheck, Bell, CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useApi';
import { formatDistanceToNow } from 'date-fns';
import { FacilitatorSidebar } from '@/components/facilitator/FacilitatorSidebar';
import { FacilitatorHeader } from '@/components/facilitator/FacilitatorHeader';

export default function FacilitatorNotifications() {
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const { data, isLoading } = useNotifications(filter === 'unread');
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    const handleMarkRead = async (id: string) => {
        try {
            await markRead.mutateAsync(id);
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllRead.mutateAsync();
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-success" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-warning" />;
            case 'error':
                return <AlertTriangle className="h-5 w-5 text-destructive" />;
            default:
                return <Info className="h-5 w-5 text-primary" />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="hidden lg:block">
                <FacilitatorSidebar />
            </div>

            <div className="lg:ml-64">
                <FacilitatorHeader title="Notifications" subtitle="Stay updated with your latest alerts" />

                <main className="p-4 lg:p-6 max-w-4xl mx-auto">
                    {/* Filters */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilter('all')}
                                size="sm"
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === 'unread' ? 'default' : 'outline'}
                                onClick={() => setFilter('unread')}
                                size="sm"
                            >
                                Unread
                                {unreadCount > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Button>
                        </div>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
                                {markAllRead.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCheck className="h-4 w-4 mr-2" />}
                                Mark all read
                            </Button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-3">
                        {isLoading ? (
                            [1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-xl" />
                            ))
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No notifications found</p>
                            </div>
                        ) : (
                            notifications.map((notification: any) => (
                                <Card
                                    key={notification.id}
                                    className={`transition-all duration-200 ${!notification.is_read
                                        ? 'bg-primary/5 border-primary/20'
                                        : 'bg-card hover:bg-muted/50'
                                        }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">{getIcon(notification.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3
                                                        className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        {notification.title}
                                                    </h3>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(notification.created_at), {
                                                            addSuffix: true,
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                            </div>
                                            {!notification.is_read && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0"
                                                    onClick={() => handleMarkRead(notification.id)}
                                                    disabled={markRead.isPending}
                                                    title="Mark as read"
                                                >
                                                    {markRead.isPending && markRead.variables === notification.id ?
                                                        <Loader2 className="h-4 w-4 animate-spin" /> :
                                                        <CheckCheck className="h-4 w-4" />
                                                    }
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
