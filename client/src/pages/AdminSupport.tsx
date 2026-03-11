import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Mail, Clock, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { getCachedToken } from '@/lib/api';

interface SupportMessage {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_identifier: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  pending: { variant: 'pending' as const, label: 'Pending', icon: Clock, color: 'text-yellow-600' },
  in_progress: { variant: 'active' as const, label: 'In Progress', icon: MessageSquare, color: 'text-blue-600' },
  resolved: { variant: 'completed' as const, label: 'Resolved', icon: CheckCircle2, color: 'text-green-600' },
  closed: { variant: 'locked' as const, label: 'Closed', icon: XCircle, color: 'text-gray-600' },
};

export default function AdminSupport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    admin_notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch support messages
  const { data: messagesData, isLoading, error } = useQuery({
    queryKey: ['support-messages', statusFilter],
    queryFn: async () => {
      const token = getCachedToken();
      console.log('Fetching support messages with token:', token ? 'Token exists' : 'No token');
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('limit', '100');
      
      const url = `${import.meta.env.VITE_API_URL}/api/support/messages?${params}`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      return data;
    },
  });

  // Update support message
  const updateMessage = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = getCachedToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/support/messages/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(data),
        }
      );
      
      if (!response.ok) throw new Error('Failed to update message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages'] });
      toast({
        title: 'Success',
        description: 'Support message updated successfully',
      });
      setIsDialogOpen(false);
      setSelectedMessage(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update support message',
        variant: 'destructive',
      });
    },
  });

  const messages: SupportMessage[] = messagesData?.messages || [];
  const total = messagesData?.total || 0;

  const filteredMessages = messages.filter((msg) =>
    msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewMessage = (message: SupportMessage) => {
    setSelectedMessage(message);
    setUpdateData({
      status: message.status,
      admin_notes: message.admin_notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleUpdateMessage = async () => {
    if (!selectedMessage) return;
    await updateMessage.mutateAsync({
      id: selectedMessage.id,
      data: updateData
    });
  };

  const stats = {
    total: messages.length,
    pending: messages.filter(m => m.status === 'pending').length,
    in_progress: messages.filter(m => m.status === 'in_progress').length,
    resolved: messages.filter(m => m.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="lg:ml-64">
        <AdminHeader title="Support Messages" />
        
        <main className="p-4 lg:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <p className="text-destructive font-medium mb-2">Error loading messages</p>
              <p className="text-muted-foreground text-sm">{error.message}</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No support messages found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => {
                const statusInfo = statusConfig[message.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div
                    key={message.id}
                    className="bg-card rounded-xl border border-border/50 p-5 shadow-soft hover:shadow-card transition-shadow cursor-pointer"
                    onClick={() => handleViewMessage(message)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{message.subject}</h3>
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          From: {message.name} ({message.email})
                          {message.user_name && (
                            <span className="ml-2">• User: {message.user_name}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.message}
                    </p>
                    
                    {message.admin_notes && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Admin Notes:</span> {message.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* View/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Support Message Details</DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              {/* Message Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedMessage.email}</p>
                </div>
                {selectedMessage.user_name && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Registered User</Label>
                    <p className="font-medium">{selectedMessage.user_name} ({selectedMessage.user_identifier})</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted</Label>
                  <p className="font-medium">
                    {new Date(selectedMessage.created_at).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label>Subject</Label>
                <p className="mt-1 font-medium">{selectedMessage.subject}</p>
              </div>

              {/* Message */}
              <div>
                <Label>Message</Label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Status Update */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={updateData.status}
                  onValueChange={(value) => setUpdateData({ ...updateData, status: value })}
                >
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={updateData.admin_notes}
                  onChange={(e) => setUpdateData({ ...updateData, admin_notes: e.target.value })}
                  placeholder="Add internal notes about this support request..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              {selectedMessage.resolved_at && (
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Resolved on {new Date(selectedMessage.resolved_at).toLocaleString()}
                    {selectedMessage.resolved_by_name && ` by ${selectedMessage.resolved_by_name}`}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateMessage} disabled={updateMessage.isPending}>
                  {updateMessage.isPending ? 'Updating...' : 'Update Message'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
