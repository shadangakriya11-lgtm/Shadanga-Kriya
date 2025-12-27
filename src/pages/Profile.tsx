import { useState } from 'react';
import { LearnerHeader } from '@/components/learner/LearnerHeader';
import { BottomNav } from '@/components/learner/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Bell, 
  LogOut,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function Profile() {
  const [notifications, setNotifications] = useState(true);

  const userInfo = {
    name: 'Sarah Mitchell',
    email: 'sarah.m@example.com',
    phone: '+91 98765 43210',
    joinedDate: 'January 15, 2024',
    userId: 'USR-2024-001247',
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <LearnerHeader userName={userInfo.name} />
      
      <main className="px-4 py-6 max-w-3xl mx-auto">
        {/* Profile Header */}
        <section className="text-center mb-8 animate-fade-in">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="font-serif text-3xl font-bold text-primary">
              {userInfo.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mb-1">
            {userInfo.name}
          </h1>
          <p className="text-muted-foreground text-sm">{userInfo.userId}</p>
          <Badge variant="active" className="mt-2">Active Member</Badge>
        </section>

        {/* User Info Card */}
        <section className="bg-card rounded-xl border border-border/50 p-5 shadow-soft mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="font-medium text-foreground mb-4">Account Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{userInfo.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{userInfo.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium text-foreground">{userInfo.joinedDate}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Settings */}
        <section className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-soft mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="font-medium text-foreground px-5 pt-5 pb-3">Settings</h2>
          
          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="text-foreground">Notifications</span>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            
            <button className="flex items-center justify-between w-full px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-foreground">Privacy & Security</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <button className="flex items-center justify-between w-full px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-foreground">Help & Support</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* Contact Admin Notice */}
        <section className="bg-muted/50 rounded-xl p-5 mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Need to update your profile?</p>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to make changes to your account information.
              </p>
            </div>
          </div>
        </section>

        {/* Sign Out */}
        <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
