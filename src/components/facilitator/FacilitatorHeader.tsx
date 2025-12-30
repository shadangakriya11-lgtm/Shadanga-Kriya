import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bell, Menu, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FacilitatorMobileSidebar } from './FacilitatorSidebar';

interface FacilitatorHeaderProps {
  title: string;
  subtitle?: string;
}

export function FacilitatorHeader({ title, subtitle }: FacilitatorHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar">
            <FacilitatorMobileSidebar onNavigate={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <div>
          <h1 className="font-serif text-lg lg:text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-xs lg:text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-4">
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
        </Button>
        <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-border">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground">Dr. Emily Watson</p>
            <p className="text-xs text-muted-foreground">Facilitator</p>
          </div>
          <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-secondary/30 flex items-center justify-center">
            <User className="h-4 w-4 lg:h-5 lg:w-5 text-secondary-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
