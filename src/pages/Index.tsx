import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, BarChart3, ArrowRight, Smartphone, Monitor, Quote, Star, Play, CheckCircle, Headphones, Lock, Heart } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const testimonials = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Clinical Psychologist",
    content: "TherapyOS has transformed how we deliver audio therapy. The strict playback controls ensure patients stay focused and complete their sessions properly.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "James Rodriguez",
    role: "Therapy Center Director",
    content: "The admin dashboard gives us complete visibility into patient progress. We can track completions, manage pauses, and ensure compliance across all locations.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Maria Chen",
    role: "Wellness Coordinator",
    content: "Our learners love the distraction-free experience. The pre-session protocols really help them get into the right mindset for healing.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
  }
];

const stats = [
  { value: "50K+", label: "Active Learners" },
  { value: "98%", label: "Completion Rate" },
  { value: "500+", label: "Therapy Centers" },
  { value: "4.9", label: "User Rating" }
];

const features = [
  {
    icon: Headphones,
    title: "Strict Audio Control",
    description: "No seeking, limited pauses, and mandatory completion for effective therapy."
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Encrypted audio content with secure user authentication and data protection."
  },
  {
    icon: Heart,
    title: "Focus on Healing",
    description: "Zero distractions design philosophy for maximum therapeutic benefit."
  }
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-foreground">TherapyOS</h1>
              <p className="text-xs text-muted-foreground">Audio Therapy Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button variant="premium" onClick={() => navigate('/auth?mode=signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-6 py-20 md:py-32">
            <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-6">
                <Play className="h-4 w-4 text-secondary-foreground" />
                <span className="text-sm font-medium text-secondary-foreground">Disciplined Audio Therapy Platform</span>
              </div>
              
              <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Transform Lives Through
                <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Focused Healing
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                A protocol-driven audio therapy ecosystem where learners achieve real results through structured, distraction-free sessions.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="premium" size="xl" className="w-full sm:w-auto shadow-lg" onClick={() => navigate('/auth?mode=signup')}>
                  Start Your Journey
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button variant="outline" size="xl" className="w-full sm:w-auto" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                  <div className="font-serif text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
                Built for Serious Therapy
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our platform is designed with one goal: effective, focused healing without distractions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-card rounded-3xl border border-border/50 p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Platform Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group bg-card rounded-3xl border border-border/50 p-8 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Smartphone className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                  Learner Mobile App
                </h3>
                <p className="text-muted-foreground mb-6">
                  Distraction-free audio therapy with strict playback rules, offline support, and pre-session protocols.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" /> Pre-lesson protocols
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" /> Controlled playback
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" /> Progress tracking
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-primary group-hover:underline" onClick={() => navigate('/auth?role=learner')}>
                  Access as Learner <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="group bg-card rounded-3xl border border-border/50 p-8 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                  Admin Dashboard
                </h3>
                <p className="text-muted-foreground mb-6">
                  Complete control over users, courses, lessons, payments, and analytics with enterprise-grade tools.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" /> User management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" /> Course & lesson control
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" /> Analytics & reports
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-primary group-hover:underline" onClick={() => navigate('/auth?role=admin')}>
                  Access as Admin <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="group bg-card rounded-3xl border border-border/50 p-8 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className="h-14 w-14 rounded-2xl bg-secondary/30 flex items-center justify-center mb-6 group-hover:bg-secondary/50 transition-colors">
                  <Users className="h-7 w-7 text-secondary-foreground" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                  Facilitator Panel
                </h3>
                <p className="text-muted-foreground mb-6">
                  Tablet-friendly interface for sub-admins to mark attendance, supervise sessions, and view reports.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" /> Attendance tracking
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" /> Session supervision
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" /> Basic reports
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-primary group-hover:underline" onClick={() => navigate('/auth?role=facilitator')}>
                  Access as Facilitator <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-border/50 mb-6">
                <Quote className="h-4 w-4 text-accent-foreground" />
                <span className="text-sm font-medium text-accent-foreground">Testimonials</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
                Trusted by Therapy Professionals
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See what healthcare providers and therapy centers say about TherapyOS.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-3xl border border-border/50 p-8 shadow-soft animate-fade-in"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Philosophy CTA */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-6">
                Not Entertainment. <span className="text-primary">Therapy.</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Our platform is designed for disciplined, focused healing. No gamification, no social features, no distractions. Just structured, protocol-driven audio therapy with complete administrative oversight.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="premium" size="xl" onClick={() => navigate('/auth?mode=signup')}>
                  Get Started Today
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button variant="outline" size="xl" onClick={() => navigate('/auth')}>
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span className="font-serif font-semibold text-foreground">TherapyOS</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Disciplined audio therapy for focused healing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">Learner App</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Admin Dashboard</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Facilitator Panel</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">HIPAA Compliance</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 TherapyOS. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
