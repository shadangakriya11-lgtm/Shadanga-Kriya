import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, MoreHorizontal, Shield, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

interface SubAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  permissions: string[];
  createdAt: string;
  lastActive: string | null;
}

const allPermissions = [
  { id: 'user_management', label: 'User Management', description: 'Create, edit, and manage users' },
  { id: 'course_view', label: 'Course View', description: 'View course details and content' },
  { id: 'course_edit', label: 'Course Edit', description: 'Edit and create courses' },
  { id: 'monitoring', label: 'Lesson Monitoring', description: 'Monitor user lesson progress' },
  { id: 'payments', label: 'Payments', description: 'View and manage transactions' },
  { id: 'analytics', label: 'Analytics', description: 'Access analytics and reports' },
];

export default function AdminSubAdmins() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    permissions: [] as string[],
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: usersData, isLoading } = useUsers({ role: 'sub_admin' });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const subAdmins: SubAdmin[] = (usersData?.users || []).map((u: any) => ({
    ...u,
    permissions: u.permissions || []
  }));

  const filteredSubAdmins = subAdmins.filter((admin) =>
    (admin.firstName + ' ' + admin.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateOrUpdate = async () => {
    try {
      if (editingId) {
        // Update
        await updateUser.mutateAsync({
          id: editingId,
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            // email is usually not editable or handled separately
            permissions: formData.permissions,
            role: 'sub_admin' // ensure role stays
          }
        });
      } else {
        // Create
        await createUser.mutateAsync({
          ...formData,
          role: 'sub_admin',
          status: 'active'
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save sub-admin', error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      permissions: [],
    });
    setEditingId(null);
  };

  const openEdit = (admin: SubAdmin) => {
    setEditingId(admin.id);
    setFormData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      password: '', // Don't fill password
      permissions: admin.permissions,
    });
    setIsDialogOpen(true);
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const subAdminColumns = [
    {
      key: 'name',
      header: 'Sub-Admin',
      render: (admin: SubAdmin) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
            <Shield className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{admin.firstName} {admin.lastName}</p>
            <p className="text-sm text-muted-foreground">{admin.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (admin: SubAdmin) => (
        <div className="flex gap-1 flex-wrap max-w-xs">
          {admin.permissions.slice(0, 2).map((perm) => (
            <Badge key={perm} variant="secondary" className="text-xs">
              {perm.replace('_', ' ')}
            </Badge>
          ))}
          {admin.permissions.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{admin.permissions.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (admin: SubAdmin) => (
        <Badge variant={admin.status === 'active' ? 'active' : 'locked'}>
          {admin.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (admin: SubAdmin) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(admin)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Permissions
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                if (confirm('Are you sure you want to delete this sub-admin?')) {
                  deleteUser.mutate(admin.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:ml-64">
          <AdminHeader title="Sub-Admin Management" subtitle="Manage sub-administrators and permissions" />
          <main className="p-4 lg:p-6">
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminHeader title="Sub-Admin Management" subtitle="Manage sub-administrators and permissions" />

        <main className="p-4 lg:p-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sub-admins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 lg:w-80 pl-9"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="premium" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sub-Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingId ? 'Edit Sub-Admin' : 'Create New Sub-Admin'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="First Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Last Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Email"
                        disabled={!!editingId} // Disable email edit
                      />
                    </div>
                    {!editingId && (
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Password"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border border-border rounded-lg">
                      {allPermissions.map((perm) => (
                        <div key={perm.id} className="flex items-start gap-3">
                          <Checkbox
                            id={perm.id}
                            checked={formData.permissions.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <div>
                            <label htmlFor={perm.id} className="text-sm font-medium cursor-pointer">
                              {perm.label}
                            </label>
                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                    <Button
                      variant="premium"
                      onClick={handleCreateOrUpdate}
                      className="w-full sm:w-auto"
                      disabled={createUser.isPending || updateUser.isPending}
                    >
                      {editingId ? 'Update Sub-Admin' : 'Create Sub-Admin'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Sub-Admins Table */}
          <div className="overflow-x-auto">
            <DataTable columns={subAdminColumns} data={filteredSubAdmins} />
          </div>
        </main>
      </div>
    </div>
  );
}
