import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, MoreHorizontal, MapPin, Shield } from 'lucide-react';
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

interface SubAdmin {
  id: string;
  name: string;
  email: string;
  locations: string[];
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  lastActive: Date;
}

const mockSubAdmins: SubAdmin[] = [
  {
    id: 'sa1',
    name: 'Dr. Emily Watson',
    email: 'e.watson@therapy.org',
    locations: ['New York', 'Boston'],
    permissions: ['user_management', 'course_view', 'monitoring'],
    isActive: true,
    createdAt: new Date('2023-11-10'),
    lastActive: new Date('2024-12-27'),
  },
  {
    id: 'sa2',
    name: 'Michael Roberts',
    email: 'm.roberts@therapy.org',
    locations: ['Los Angeles'],
    permissions: ['user_management', 'payments'],
    isActive: true,
    createdAt: new Date('2024-02-15'),
    lastActive: new Date('2024-12-26'),
  },
  {
    id: 'sa3',
    name: 'Lisa Chen',
    email: 'l.chen@therapy.org',
    locations: ['Chicago', 'Detroit'],
    permissions: ['course_view', 'monitoring', 'analytics'],
    isActive: false,
    createdAt: new Date('2024-05-20'),
    lastActive: new Date('2024-11-15'),
  },
];

const allPermissions = [
  { id: 'user_management', label: 'User Management', description: 'Create, edit, and manage users' },
  { id: 'course_view', label: 'Course View', description: 'View course details and content' },
  { id: 'course_edit', label: 'Course Edit', description: 'Edit and create courses' },
  { id: 'monitoring', label: 'Lesson Monitoring', description: 'Monitor user lesson progress' },
  { id: 'payments', label: 'Payments', description: 'View and manage transactions' },
  { id: 'analytics', label: 'Analytics', description: 'Access analytics and reports' },
];

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
          <p className="font-medium text-foreground">{admin.name}</p>
          <p className="text-sm text-muted-foreground">{admin.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'locations',
    header: 'Locations',
    render: (admin: SubAdmin) => (
      <div className="flex items-center gap-2 flex-wrap">
        {admin.locations.map((loc) => (
          <Badge key={loc} variant="outline" className="gap-1">
            <MapPin className="h-3 w-3" />
            {loc}
          </Badge>
        ))}
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
      <Badge variant={admin.isActive ? 'active' : 'locked'}>
        {admin.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    key: 'lastActive',
    header: 'Last Active',
    render: (admin: SubAdmin) => (
      <span className="text-muted-foreground">
        {admin.lastActive.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
          <DropdownMenuItem>Manage Locations</DropdownMenuItem>
          <DropdownMenuItem>Reset Password</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: 'w-12',
  },
];

export default function AdminSubAdmins() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const filteredSubAdmins = mockSubAdmins.filter((admin) =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permId)
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64">
        <AdminHeader title="Sub-Admin Management" subtitle="Manage sub-administrators and permissions" />
        
        <main className="p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sub-admins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-9"
                />
              </div>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="premium">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sub-Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif">Create New Sub-Admin</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input placeholder="Enter full name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="Enter email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Locations</Label>
                    <Input placeholder="e.g., New York, Boston (comma separated)" />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-3 p-4 border border-border rounded-lg">
                      {allPermissions.map((perm) => (
                        <div key={perm.id} className="flex items-start gap-3">
                          <Checkbox
                            id={perm.id}
                            checked={selectedPermissions.includes(perm.id)}
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
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button variant="premium" onClick={() => setIsCreateOpen(false)}>Create Sub-Admin</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Total Sub-Admins</p>
              <p className="font-serif text-2xl font-bold text-foreground">{mockSubAdmins.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="font-serif text-2xl font-bold text-success">
                {mockSubAdmins.filter(a => a.isActive).length}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Locations Covered</p>
              <p className="font-serif text-2xl font-bold text-foreground">
                {new Set(mockSubAdmins.flatMap(a => a.locations)).size}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="font-serif text-2xl font-bold text-locked">
                {mockSubAdmins.filter(a => !a.isActive).length}
              </p>
            </div>
          </div>

          {/* Sub-Admins Table */}
          <DataTable columns={subAdminColumns} data={filteredSubAdmins} />
        </main>
      </div>
    </div>
  );
}
