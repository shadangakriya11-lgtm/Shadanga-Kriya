import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useApi';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NotificationBell() {
    const navigate = useNavigate();
    const { data } = useNotifications(true); // Only unread
    const unreadCount = data?.unreadCount || 0;
    const recentNotifications = data?.notifications?.slice(0, 3) || [];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                            <Badge variant="secondary">{unreadCount} new</Badge>
                        )}
                    </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No new notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {recentNotifications.map((notification: any) => (
                                <div
                                    key={notification.id}
                                    className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => navigate('/notifications')}
                                >
                                    <p className="font-medium text-sm text-foreground line-clamp-2">
                                        {notification.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(notification.created_at), {
                                            addSuffix: true,
                                        })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {recentNotifications.length > 0 && (
                    <div className="p-2 border-t border-border">
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => navigate('/notifications')}
                        >
                            View All Notifications
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
