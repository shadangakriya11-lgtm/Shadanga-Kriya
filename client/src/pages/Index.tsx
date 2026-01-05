import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Play,
  CheckCircle,
  Heart,
  Brain,
  Sunrise,
  Moon,
  Shield,
  Users,
  BarChart3,
  Star,
  Quote,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Yoga Practitioner",
    content:
      "Shadanga Kriya has transformed my daily practice. The guided audio sessions help me achieve deeper states of meditation than ever before.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Dr. Rajesh Mehta",
    role: "Wellness Center Director",
    content:
      "We've integrated Shadanga Kriya into our therapy programs. The structured approach and progress tracking have significantly improved patient outcomes.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Ananya Patel",
    role: "Mindfulness Coach",
    content:
      "The distraction-free experience is exactly what my clients needed. It keeps them focused and committed to their healing journey.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
  },
];

const stats = [
  { value: "50K+", label: "Active Practitioners", icon: Users },
  { value: "98%", label: "Completion Rate", icon: CheckCircle },
  { value: "500+", label: "Wellness Centers", icon: Heart },
  { value: "4.9", label: "User Rating", icon: Star },
];

const features = [
  {
    icon: Brain,
    title: "Mindful Audio Sessions",
    description:
      "Carefully crafted audio content designed to guide you through authentic Shadanga Kriya practices.",
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Focused Environment",
    description:
      "Zero distractions. Our controlled playback ensures you complete each session for maximum benefit.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Sunrise,
    title: "Daily Rituals",
    description:
      "Establish powerful morning and evening routines with pre-session protocols and guided breathing.",
    gradient: "from-teal-600 to-teal-400",
  },
];

const journeySteps = [
  {
    step: "01",
    title: "Begin",
    description: "Create your account and set your intentions",
  },
  {
    step: "02",
    title: "Practice",
    description: "Follow guided audio sessions at your own pace",
  },
  {
    step: "03",
    title: "Transform",
    description: "Track progress and witness your transformation",
  },
];

export default function Index() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Floating Background Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl opacity-30 animate-float-slow"
          style={{
            background:
              "radial-gradient(circle, hsl(174 65% 40% / 0.3) 0%, transparent 70%)",
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        />
        <div
          className="absolute top-40 right-20 w-80 h-80 rounded-full blur-3xl opacity-20 animate-float"
          style={{
            background:
              "radial-gradient(circle, hsl(38 85% 55% / 0.3) 0%, transparent 70%)",
            transform: `translateY(${scrollY * 0.15}px)`,
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute bottom-40 left-1/3 w-72 h-72 rounded-full blur-3xl opacity-25"
          style={{
            background:
              "radial-gradient(circle, hsl(180 55% 35% / 0.25) 0%, transparent 70%)",
            transform: `translateY(${scrollY * -0.05}px)`,
          }}
        />
      </div>

      {/* Sticky Header */}
      <header className={`sticky-nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="relative">
              <img
                src="/shadanga-kriya-logo.png"
                alt="Shadanga Kriya"
                className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#journey"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Journey
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Stories
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="hidden sm:inline-flex hover:text-primary"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              className="brand-button-primary text-white px-6 py-2 rounded-full font-medium"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center">
          {/* Hero Background Gradient */}
          <div className="absolute inset-0 -z-10 brand-gradient-bg" />

          <div className="container mx-auto px-6 py-20 md:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-teal-500/10 border border-primary/20 mb-8 animate-fade-in">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Ancient Wisdom, Modern Practice
                  </span>
                </div>

                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in-up animation-fill-both">
                  Discover Inner
                  <span className="block gradient-text-brand">
                    Peace & Clarity
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up animation-fill-both animate-delay-200">
                  Experience the transformative power of Shadanga Kriya through
                  guided audio sessions designed for deep healing and spiritual
                  growth.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up animation-fill-both animate-delay-300">
                  <Button
                    size="lg"
                    className="brand-button-primary text-white w-full sm:w-auto px-8 py-6 text-lg rounded-full font-semibold shadow-lg"
                    onClick={() => navigate("/auth?mode=signup")}
                  >
                    Begin Your Journey
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-8 py-6 text-lg rounded-full border-2 hover:border-primary hover:text-primary"
                    onClick={() => navigate("/auth")}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Watch Demo
                  </Button>
                </div>
              </div>

              {/* Right Content - Logo Showcase */}
              <div className="relative hidden lg:flex items-center justify-center animate-fade-in-scale animation-fill-both animate-delay-400">
                <div className="relative">
                  {/* Glowing backdrop */}
                  <div className="absolute inset-0 blur-3xl opacity-40 animate-pulse-glow">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 via-cyan-400 to-amber-400" />
                  </div>

                  {/* Main logo */}
                  <img
                    src="/shadanga-kriya-logo.png"
                    alt="Shadanga Kriya"
                    className="relative w-full max-w-lg h-auto object-contain animate-float-slow drop-shadow-2xl"
                  />

                  {/* Floating elements */}
                  <div
                    className="absolute -top-8 -right-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg animate-float"
                    style={{ animationDelay: "0.5s" }}
                  >
                    <Sunrise className="h-8 w-8 text-white" />
                  </div>
                  <div
                    className="absolute -bottom-4 -left-8 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg animate-float"
                    style={{ animationDelay: "1s" }}
                  >
                    <Moon className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-6 rounded-3xl glass-brand animate-fade-in-up animation-fill-both hover-lift"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <stat.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                  <div className="font-serif text-3xl md:text-4xl font-bold gradient-text-brand mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-fade-in">
                Why Shadanga Kriya
              </span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in-up">
                A Holistic Approach to
                <span className="gradient-text-brand"> Wellness</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animate-delay-100">
                Our platform combines ancient yogic practices with modern
                technology to deliver a truly transformative experience.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group brand-card p-8 animate-fade-in-up animation-fill-both"
                  style={{ animationDelay: `${(index + 1) * 150}ms` }}
                >
                  <div
                    className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
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
              <div className="group brand-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Brain className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                    Learner App
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Immersive audio therapy with strict playback rules, offline
                    support, and pre-session breathing protocols.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {[
                      "Guided meditations",
                      "Progress tracking",
                      "Offline access",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto text-primary hover:text-primary/80 group-hover:underline font-medium"
                    onClick={() => navigate("/auth?role=learner")}
                  >
                    Start as Learner{" "}
                    <ArrowRight className="h-4 w-4 ml-1 inline" />
                  </Button>
                </div>
              </div>

              <div className="group brand-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                    Admin Dashboard
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Complete control over users, courses, lessons, payments, and
                    analytics with enterprise-grade tools.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {[
                      "User management",
                      "Course control",
                      "Analytics & reports",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto text-amber-600 dark:text-amber-400 hover:text-amber-500 group-hover:underline font-medium"
                    onClick={() => navigate("/auth?role=admin")}
                  >
                    Access as Admin{" "}
                    <ArrowRight className="h-4 w-4 ml-1 inline" />
                  </Button>
                </div>
              </div>

              <div className="group brand-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-600/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-600/20 to-teal-400/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7 text-teal-700 dark:text-teal-300" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                    Facilitator Panel
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Tablet-friendly interface for facilitators to mark
                    attendance, supervise sessions, and view reports.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {[
                      "Attendance tracking",
                      "Session supervision",
                      "Progress reports",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto text-teal-600 dark:text-teal-400 hover:text-teal-500 group-hover:underline font-medium"
                    onClick={() => navigate("/auth?role=facilitator")}
                  >
                    Access as Facilitator{" "}
                    <ArrowRight className="h-4 w-4 ml-1 inline" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Journey Section */}
        <section id="journey" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5" />
          </div>

          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium mb-4">
                Your Path
              </span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                Simple Steps to
                <span className="gradient-text-golden"> Transformation</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {journeySteps.map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-serif text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {item.step}
                    </div>
                    {index < journeySteps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-y-1/2 ml-4" />
                    )}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                <Quote className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Testimonials
                </span>
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                Stories of
                <span className="gradient-text-brand"> Transformation</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Hear from practitioners who have experienced the power of
                Shadanga Kriya.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="brand-card p-8 animate-fade-in-up animation-fill-both"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                    />
                    <div>
                      <div className="font-semibold text-foreground">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-teal-500/5 to-amber-500/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 bg-gradient-to-br from-teal-400 to-amber-400" />
          </div>

          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <Heart className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">
                  Start Your Practice Today
                </span>
              </div>

              <h2 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-6">
                Ready to Begin Your
                <span className="block gradient-text-brand">
                  Healing Journey?
                </span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Join thousands of practitioners who have discovered inner peace
                and clarity through Shadanga Kriya. Your transformation starts
                with a single step.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="brand-button-primary text-white px-10 py-6 text-lg rounded-full font-semibold shadow-xl"
                  onClick={() => navigate("/auth?mode=signup")}
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-10 py-6 text-lg rounded-full border-2 hover:border-primary hover:text-primary"
                  onClick={() => navigate("/auth")}
                >
                  Contact Us
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
                <img
                  src="/shadanga-kriya-logo.png"
                  alt="Shadanga Kriya"
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Ancient wisdom for modern healing. Experience transformation
                through authentic practice.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">
                  Learner App
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors">
                  Admin Dashboard
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors">
                  Facilitator Panel
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">
                  About Us
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors">
                  Our Teachers
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors">
                  Contact
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">
                  Privacy Policy
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors">
                  Terms of Service
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors">
                  Cookie Policy
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Shadanga Kriya. All rights reserved.
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
