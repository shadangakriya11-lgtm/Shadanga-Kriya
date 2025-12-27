import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, BarChart3, ArrowRight, Smartphone, Monitor } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif font-semibold text-foreground">TherapyOS</h1>
              <p className="text-xs text-muted-foreground">Audio Therapy Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Learner Login
            </Button>
            <Button variant="premium" onClick={() => navigate('/admin')}>
              Admin Console
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <section className="text-center max-w-4xl mx-auto mb-20 animate-fade-in">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Disciplined Audio Therapy
            <span className="block text-primary">For Focused Healing</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            A protocol-driven audio therapy ecosystem where learners focus on recovery, and administrators maintain complete operational control.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="premium" size="xl" onClick={() => navigate('/splash')}>
              <Smartphone className="h-5 w-5 mr-2" />
              Learner App
            </Button>
            <Button variant="outline" size="xl" onClick={() => navigate('/admin')}>
              <Monitor className="h-5 w-5 mr-2" />
              Admin Dashboard
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-soft animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Smartphone className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
              Learner Mobile App
            </h3>
            <p className="text-muted-foreground mb-4">
              Distraction-free audio therapy with strict playback rules, offline support, and pre-session protocols.
            </p>
            <Button variant="ghost" className="p-0 h-auto text-primary" onClick={() => navigate('/splash')}>
              Access App <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-soft animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
              Admin Dashboard
            </h3>
            <p className="text-muted-foreground mb-4">
              Complete control over users, courses, lessons, payments, and analytics with enterprise-grade tools.
            </p>
            <Button variant="ghost" className="p-0 h-auto text-primary" onClick={() => navigate('/admin')}>
              Open Dashboard <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-soft animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
              Facilitator Panel
            </h3>
            <p className="text-muted-foreground mb-4">
              Tablet-friendly interface for sub-admins to mark attendance, supervise sessions, and view reports.
            </p>
            <Button variant="ghost" className="p-0 h-auto text-primary" disabled>
              Coming Soon <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </section>

        {/* Platform Philosophy */}
        <section className="bg-primary/5 rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
            Not Entertainment. Therapy.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform is designed for disciplined, focused healing. No gamification, no social features, no distractions. Just structured, protocol-driven audio therapy with complete administrative oversight.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-6 py-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © 2024 TherapyOS. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted-foreground">Privacy Policy</span>
            <span className="text-sm text-muted-foreground">Terms of Service</span>
            <span className="text-sm text-muted-foreground">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
