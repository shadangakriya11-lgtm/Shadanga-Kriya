import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bell, Search, User } from "lucide-react";
import { AdminMobileSidebar } from "./AdminSidebar";

import { Link } from "react-router-dom";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <AdminMobileSidebar />
        <div>
          <h1 className="font-serif text-lg lg:text-xl font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Search - hidden on mobile */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-48 lg:w-64 pl-9 bg-background"
          />
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link to="/admin/notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
          </Link>
        </Button>
        {/* User info - simplified on mobile */}
        <div className="flex items-center gap-3 pl-2 lg:pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">Admin User</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
          <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
