import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockUsers } from '@/data/mockData';
import { User } from '@/types';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const userColumns = [
  {
    key: 'name',
    header: 'User',
    render: (user: User) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="font-medium text-foreground">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    render: (user: User) => (
      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'subadmin' ? 'secondary' : 'outline'}>
        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
      </Badge>
    ),
  },
  {
    key: 'isActive',
    header: 'Status',
    render: (user: User) => (
      <Badge variant={user.isActive ? 'active' : 'locked'}>
        {user.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: (user: User) => (
      <span className="text-muted-foreground">
        {user.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    ),
  },
  {
    key: 'lastActive',
    header: 'Last Active',
    render: (user: User) => (
      <span className="text-muted-foreground">
        {user.lastActive?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
          <DropdownMenuItem>Edit User</DropdownMenuItem>
          <DropdownMenuItem>Assign Courses</DropdownMenuItem>
          <DropdownMenuItem>Reset Password</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: 'w-12',
  },
];

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64">
        <AdminHeader title="User Management" subtitle="Manage learners and their access" />
        
        <main className="p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            <Button variant="premium">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="font-serif text-2xl font-bold text-foreground">1,247</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="font-serif text-2xl font-bold text-success">892</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="font-serif text-2xl font-bold text-locked">355</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <p className="text-sm text-muted-foreground">Sub-Admins</p>
              <p className="font-serif text-2xl font-bold text-foreground">12</p>
            </div>
          </div>

          {/* Users Table */}
          <DataTable columns={userColumns} data={filteredUsers} />
        </main>
      </div>
    </div>
  );
}
