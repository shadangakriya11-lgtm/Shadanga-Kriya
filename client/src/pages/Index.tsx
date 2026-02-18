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
  Shield,
  Users,
  Star,
  Headphones,
  Clock,
  Wind,
  Leaf,
  Moon,
  Sun,
  Waves,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { NativeOnboarding } from "@/components/NativeOnboarding";

const stats = [
  { value: "10K+", label: "Meditators", icon: Users },
  { value: "100%", label: "Result Oriented", icon: CheckCircle },
  { value: "6", label: "Kriya Practices", icon: Headphones },
  { value: "4.9", label: "User Rating", icon: Star },
];

const meditationBenefits = [
  {
    icon: Wind,
    title: "Guided Breathing",
    description:
      "Practice pranayama and deep breathing techniques with audio guidance for stress relief and mental clarity.",
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    icon: Brain,
    title: "Mind Stillness",
    description:
      "Achieve profound states of mental calm through scientific meditation techniques rooted in ancient wisdom.",
    gradient: "from-teal-500 to-emerald-500",
  },
  {
    icon: Moon,
    title: "Deep Relaxation",
    description:
      "Enter alpha state awareness for deep relaxation, better sleep, and emotional balance.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Sunrise,
    title: "Daily Practice",
    description:
      "Build a consistent meditation habit with structured 6-part Kriya sessions designed for lasting transformation.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Heart,
    title: "Inner Peace",
    description:
      "Cultivate lasting inner peace, emotional resilience, and a profound sense of well-being through regular practice.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Leaf,
    title: "Mindful Living",
    description:
      "Extend the benefits of meditation into daily life with enhanced focus, clarity, and presence.",
    gradient: "from-green-500 to-teal-500",
  },
];

const journeySteps = [
  {
    step: "01",
    title: "Breathe",
    description:
      "Begin with guided breathing exercises to calm your mind and prepare for meditation",
    icon: Wind,
  },
  {
    step: "02",
    title: "Meditate",
    description:
      "Follow audio-guided Shadanga Kriya sessions for deep inner transformation",
    icon: Moon,
  },
  {
    step: "03",
    title: "Transform",
    description:
      "Experience lasting peace, clarity, and enhanced mental capabilities",
    icon: Sun,
  },
];

export default function Index() {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const isNativePlatform = Capacitor.isNativePlatform();

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (!isLoading && isLoggedIn && user) {
      const redirectPath =
        user.role === "admin" || user.role === "sub_admin"
          ? "/admin"
          : user.role === "facilitator"
            ? "/facilitator"
            : "/home";
      navigate(redirectPath, { replace: true });
    }
  }, [isLoading, isLoggedIn, user, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Show nothing while checking auth to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Native App - Use dedicated onboarding component
  if (isNativePlatform) {
    return <NativeOnboarding />;
  }

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

      {/* Sticky Header - Hidden on Native App for cleaner experience */}
      {!isNativePlatform && (
        <header className={`sticky-nav ${isScrolled ? "scrolled" : ""}`}>
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div
              className="flex items-center gap-2 sm:gap-4 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="relative">
                <img
                  src="/shadanga-kriya-logo.png"
                  alt="Shadanga Kriya"
                  className="h-10 sm:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
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
              <span
                onClick={() => navigate("/about")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                About
              </span>
              <span
                onClick={() => navigate("/contact")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Contact
              </span>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}
                className="hidden sm:inline-flex hover:text-primary"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="brand-button-primary text-white px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </div>
          </div>
        </header>
      )}

      <main>
        {/* Hero Section */}
        <section className="relative flex items-center min-h-[90vh]">
          {/* Hero Background Gradient */}
          <div className="absolute inset-0 -z-10 brand-gradient-bg" />

          <div className="container mx-auto px-6 py-20 md:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-teal-500/10 border border-primary/20 mb-8 animate-fade-in">
                  <Moon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Guided Meditation App
                  </span>
                </div>

                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in-up animation-fill-both">
                  Find Your
                  <span className="block gradient-text-brand">
                    Inner Peace
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up animation-fill-both animate-delay-200">
                  Transform your mind with Shadanga Kriya — a guided audio meditation
                  practice for deep relaxation, mental clarity, and lasting peace.
                </p>

                {/* Meditation benefits */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-10 animate-fade-in-up animation-fill-both animate-delay-250">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border/50 text-sm text-muted-foreground">
                    <Wind className="h-4 w-4 text-primary" /> Breathing Exercises
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border/50 text-sm text-muted-foreground">
                    <Headphones className="h-4 w-4 text-primary" /> Audio Guided
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border/50 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4 text-primary" /> Inner Peace
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up animation-fill-both animate-delay-300">
                  <Button
                    size="lg"
                    className="brand-button-primary text-white w-full sm:w-auto px-8 py-6 text-lg rounded-full font-semibold shadow-lg"
                    onClick={() => navigate("/auth?mode=signup")}
                  >
                    Start Meditating
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-8 py-6 text-lg rounded-full border-2 hover:border-primary hover:text-primary"
                    onClick={() => navigate("/demo")}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Try Free Demo
                  </Button>
                </div>
              </div>

              {/* Right Content - Meditation Visual (Desktop only) */}
              <div className="relative hidden lg:flex items-center justify-center animate-fade-in-scale animation-fill-both animate-delay-400">
                <div className="relative flex items-center justify-center">
                  {/* Breathing rings - meditation visual */}
                  <div className="absolute w-[400px] h-[400px] rounded-full border-2 border-primary/15 animate-breathe" />
                  <div className="absolute w-[450px] h-[450px] rounded-full border border-primary/10 animate-breathe" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute w-[500px] h-[500px] rounded-full border border-primary/5 animate-breathe" style={{ animationDelay: '1s' }} />

                  {/* Outer aura glow */}
                  <div className="absolute w-[420px] h-[420px] rounded-full animate-aura-pulse">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400/20 via-cyan-400/10 to-indigo-400/15 blur-2xl" />
                  </div>

                  {/* Inner glowing backdrop */}
                  <div className="absolute w-[350px] h-[350px] rounded-full animate-breathe-glow">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400/30 via-cyan-400/20 to-amber-400/20 blur-3xl" />
                  </div>

                  {/* Main logo with gentle meditation animation */}
                  <div className="relative animate-meditate">
                    <img
                      src="/shadanga-kriya-logo.png"
                      alt="Shadanga Kriya"
                      className="relative w-72 h-72 object-contain drop-shadow-2xl"
                    />
                  </div>

                  {/* Floating meditation icon */}
                  <div
                    className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg animate-float"
                    style={{ animationDelay: "0.5s" }}
                  >
                    <Moon className="h-8 w-8 text-white" />
                  </div>

                  {/* Additional floating element */}
                  <div
                    className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg animate-float"
                    style={{ animationDelay: "1s" }}
                  >
                    <Wind className="h-6 w-6 text-white" />
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

        {/* Web-only sections */}
        <>
          {/* Features Section */}
          <section id="features" className="py-24 relative">
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-fade-in">
                  Why Meditate With Us
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in-up">
                  The Path to
                  <span className="gradient-text-brand"> Inner Peace</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animate-delay-100">
                  Shadanga Kriya is a 6-part guided meditation practice that combines
                  ancient breathing techniques with modern audio therapy for deep relaxation
                  and mental clarity.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {meditationBenefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="group brand-card p-8 animate-fade-in-up animation-fill-both"
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    <div
                      className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <benefit.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* App Preview Card - Meditation Focus */}
              <div className="max-w-4xl mx-auto">
                <div className="brand-card p-8 md:p-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-500/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

                  <div className="relative grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                        <Moon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          Your Daily Meditation Practice
                        </span>
                      </div>
                      <h3 className="font-serif text-3xl font-bold text-foreground mb-4">
                        Transform Your
                        <span className="gradient-text-brand block">
                          Mind & Spirit
                        </span>
                      </h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        Experience profound inner peace and mental clarity through
                        our structured 6-part meditation practice guided by
                        soothing audio sessions.
                      </p>
                      <ul className="space-y-3 mb-8">
                        {[
                          "Guided breathing exercises (Pranayama)",
                          "Deep relaxation techniques",
                          "Mindfulness & present-moment awareness",
                          "Stress relief & emotional balance",
                          "Enhanced focus & mental clarity",
                        ].map((item, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-3 text-sm text-muted-foreground group"
                          >
                            <CheckCircle className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="group-hover:text-foreground transition-colors">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="brand-button-primary text-white px-8 py-6 text-lg rounded-full font-semibold"
                        onClick={() => navigate("/auth?mode=signup")}
                      >
                        Begin Your Practice
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </div>

                    <div className="hidden md:flex items-center justify-center">
                      <div className="relative">
                        {/* Breathing rings for meditation visual */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 rounded-full border border-primary/20 animate-breathe" />
                          <div className="absolute w-56 h-56 rounded-full border border-primary/10 animate-breathe" style={{ animationDelay: '0.5s' }} />
                        </div>
                        <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-br from-teal-400 to-indigo-400 rounded-full animate-pulse-glow" />
                        <img
                          src="/shadanga-kriya-logo.png"
                          alt="Shadanga Kriya Meditation App"
                          className="relative w-56 h-auto object-contain animate-float-slow"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Journey Section - Meditation Flow */}
          <section id="journey" className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-teal-500/5" />
            </div>

            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-4">
                  Your Meditation Journey
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Three Steps to
                  <span className="gradient-text-brand"> Inner Peace</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Follow this simple path to experience the transformative power of meditation
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {journeySteps.map((item, index) => (
                  <div key={index} className="text-center group">
                    <div className="relative inline-block mb-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <item.icon className="h-10 w-10" />
                      </div>
                      {index < journeySteps.length - 1 && (
                        <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-indigo-400/50 to-transparent -translate-y-1/2 ml-4" />
                      )}
                    </div>
                    <div className="text-sm text-primary font-medium mb-1">Step {item.step}</div>
                    <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Outcomes Section - Meditation Benefits */}
          <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/20 via-transparent to-muted/20" />

            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-medium mb-4 animate-fade-in">
                  Meditation Benefits
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in-up">
                  What You'll
                  <span className="gradient-text-brand"> Experience</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animate-delay-100">
                  Regular meditation practice brings profound changes to your mind, body, and spirit
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {[
                  {
                    icon: Moon,
                    title: "Deep Relaxation",
                    description:
                      "Experience profound states of calm and release daily stress and tension",
                    color: "from-indigo-500 to-purple-500",
                  },
                  {
                    icon: Heart,
                    title: "Emotional Balance",
                    description:
                      "Gain control over emotions and cultivate lasting inner peace",
                    color: "from-rose-500 to-pink-500",
                  },
                  {
                    icon: Brain,
                    title: "Mental Clarity",
                    description:
                      "Clear mental fog and enhance focus, concentration, and decision-making",
                    color: "from-teal-500 to-cyan-500",
                  },
                  {
                    icon: Wind,
                    title: "Better Breathing",
                    description:
                      "Master pranayama techniques for improved vitality and energy",
                    color: "from-cyan-500 to-blue-500",
                  },
                  {
                    icon: Sunrise,
                    title: "Peaceful Sleep",
                    description:
                      "Fall asleep faster and enjoy deeper, more restorative rest",
                    color: "from-amber-500 to-orange-500",
                  },
                  {
                    icon: Leaf,
                    title: "Mindful Living",
                    description:
                      "Bring awareness and presence into every moment of your day",
                    color: "from-green-500 to-emerald-500",
                  },
                ].map((outcome, index) => (
                  <div
                    key={index}
                    className="group relative p-6 rounded-2xl bg-card border border-border/50 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 animate-fade-in-up animation-fill-both overflow-hidden"
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                      }}
                    />
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${outcome.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                    >
                      <outcome.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {outcome.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {outcome.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Who Can Benefit Section */}
          <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/5 via-transparent to-teal-500/5" />

            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium mb-4 animate-fade-in">
                  Who Is It For?
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in-up">
                  Who Can
                  <span className="gradient-text-brand"> Benefit</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animate-delay-100">
                  Shadanga Kriya is designed for anyone seeking to enhance their
                  mental capabilities
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {[
                  {
                    emoji: "🎓",
                    title: "Students",
                    description: "Excel in exams with better memory and focus",
                  },
                  {
                    emoji: "💼",
                    title: "Professionals",
                    description: "Enhance decision-making and productivity",
                  },
                  {
                    emoji: "🏢",
                    title: "Business Owners",
                    description: "Sharpen strategic thinking and clarity",
                  },
                  {
                    emoji: "🏠",
                    title: "Homemakers",
                    description: "Improve daily focus and emotional balance",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="group text-center p-6 rounded-2xl bg-card border border-border/50 shadow-soft hover:shadow-elevated hover:-translate-y-2 transition-all duration-300 animate-fade-in-up animation-fill-both"
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    <div className="text-5xl mb-4 group-hover:animate-bounce-subtle">
                      {item.emoji}
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-24 bg-muted/20">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-sm font-medium mb-4 animate-fade-in">
                  FAQ
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in-up">
                  Frequently Asked
                  <span className="gradient-text-brand"> Questions</span>
                </h2>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {[
                  {
                    question: "What is Shadanga Kriya meditation?",
                    answer:
                      "Shadanga Kriya is a 6-part guided audio meditation practice that combines ancient breathing techniques (pranayama) with modern audio therapy. It's designed to bring deep relaxation, mental clarity, and lasting inner peace.",
                  },
                  {
                    question: "How long are the meditation sessions?",
                    answer:
                      "Sessions range from 15 to 45 minutes. We recommend starting with shorter sessions and gradually increasing as you become more comfortable with the practice.",
                  },
                  {
                    question: "Do I need any prior meditation experience?",
                    answer:
                      "No prior experience is needed. Our guided audio sessions are designed for complete beginners as well as experienced meditators looking to deepen their practice.",
                  },
                  {
                    question: "When will I start seeing benefits?",
                    answer:
                      "Many practitioners report feeling calmer and more focused after their very first session. With regular daily practice, you'll experience deeper benefits within the first few weeks.",
                  },
                ].map((faq, index) => (
                  <div
                    key={index}
                    className="group bg-card rounded-2xl border border-border/50 p-6 shadow-soft hover:shadow-card transition-all duration-300 animate-fade-in-up animation-fill-both"
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-3 flex items-start gap-3">
                      <span className="text-primary text-xl">Q.</span>
                      <span className="group-hover:text-primary transition-colors">
                        {faq.question}
                      </span>
                    </h3>
                    <p className="text-muted-foreground leading-relaxed pl-8">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-primary/5 to-teal-500/10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 bg-gradient-to-br from-indigo-400 to-teal-400 animate-pulse-glow" />
            </div>

            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
                  <Moon className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">
                    Begin Your Meditation Journey
                  </span>
                </div>

                <h2 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in-up">
                  Ready to Find
                  <span className="block gradient-text-brand">Inner Peace?</span>
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up animate-delay-100">
                  Join thousands who have discovered calm, clarity, and emotional
                  balance through Shadanga Kriya meditation. Your journey to
                  inner peace starts today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-delay-200">
                  <Button
                    size="lg"
                    className="brand-button-primary text-white px-10 py-6 text-lg rounded-full font-semibold shadow-xl group"
                    onClick={() => navigate("/auth?mode=signup")}
                  >
                    Start Meditating Free
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-10 py-6 text-lg rounded-full border-2 hover:border-primary hover:text-primary transition-all"
                    onClick={() => navigate("/auth")}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/shadanga-kriya-logo.png"
                  alt="Shadanga Kriya"
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                A guided audio meditation app designed to bring deep relaxation,
                mental clarity, and lasting inner peace through the ancient practice
                of Shadanga Kriya.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-primary cursor-pointer transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#journey"
                    className="hover:text-primary cursor-pointer transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li
                  className="hover:text-primary cursor-pointer transition-colors"
                  onClick={() => navigate("/about")}
                >
                  About Us
                </li>
                <li
                  className="hover:text-primary cursor-pointer transition-colors"
                  onClick={() => navigate("/contact")}
                >
                  Contact Us
                </li>
                <li
                  className="hover:text-primary cursor-pointer transition-colors"
                  onClick={() => navigate("/auth?mode=signup")}
                >
                  Get Started
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li 
                  className="hover:text-primary cursor-pointer transition-colors"
                  onClick={() => navigate('/privacy')}
                >
                  Privacy Policy
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Shadanga Kriya. All rights reserved.
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
