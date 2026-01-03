import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Play,
  BarChart3,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/facilitator' },
  { icon: Users, label: 'Attendance', href: '/facilitator/attendance' },
  { icon: Play, label: 'Sessions', href: '/facilitator/sessions' },
  { icon: BarChart3, label: 'Reports', href: '/facilitator/reports' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-secondary/30 flex items-center justify-center flex-shrink-0">
          <Shield className="h-5 w-5 text-sidebar-primary" />
        </div>
        <div>
          <h1 className="font-serif font-semibold text-sidebar-foreground">TherapyOS</h1>
          <p className="text-xs text-sidebar-foreground/60">Facilitator</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <div className="flex justify-start px-3 py-2">
          <ThemeToggle />
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export function FacilitatorSidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex-col border-r border-sidebar-border hidden lg:flex">
        <SidebarContent />
      </aside>
    </>
  );
}

export function FacilitatorMobileSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return <SidebarContent onNavigate={onNavigate} />;
}
