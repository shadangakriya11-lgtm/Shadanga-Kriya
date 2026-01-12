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
  Download,
  Headphones,
  Clock,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const stats = [
  { value: "10K+", label: "Active Practitioners", icon: Users },
  { value: "100%", label: "Result Oriented", icon: CheckCircle },
  { value: "6", label: "Kriya Practices", icon: Headphones },
  { value: "4.9", label: "User Rating", icon: Star },
];

const features = [
  {
    icon: Brain,
    title: "Scientific Meditation Process",
    description:
      "Research-based meditation techniques to enhance focus, sensory intelligence, and audio-visual memory through structured inner practices.",
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Brain & Mind Mastery",
    description:
      "Access alpha state awareness to control distractions, build emotional balance, and operate your brain efficiently.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Sunrise,
    title: "Sensory Memory Enhancement",
    description:
      "Through प्रत्योक्षकरण and क्रमवीक्षण क्रिया, sharpen all five senses and develop powerful sensory memories.",
    gradient: "from-teal-600 to-teal-400",
  },
  {
    icon: Download,
    title: "Audio-Visual Learning",
    description:
      "Master the art of memorising and visualising what you see, listen, read or experience along with emotions.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Clock,
    title: "Effective Revision System",
    description:
      "Learn mental revision processes that help you recall your entire syllabus in audio-visual and sensory form.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Heart,
    title: "Self Confidence Building",
    description:
      "Develop self-reliance, set definite goals, and build the confidence needed to excel in competitive environments.",
    gradient: "from-rose-500 to-red-500",
  },
];

const journeySteps = [
  {
    step: "01",
    title: "Learn",
    description:
      "Understand the mechanism of brain and mind through scientific meditation",
  },
  {
    step: "02",
    title: "Practice",
    description:
      "Follow guided Shadanga Kriya sessions with प्रत्योक्षकरण techniques",
  },
  {
    step: "03",
    title: "Transform",
    description:
      "Experience sharper memory, emotional control, and lasting confidence",
  },
];

export default function Index() {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (!isLoading && isLoggedIn && user) {
      const redirectPath =
        user.role === "admin" || user.role === "sub_admin"
          ? "/admin"
          : user.role === "facilitator"
          ? "/facilitator"
          : "/learner";
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
                <div className="relative flex items-center justify-center">
                  {/* Outer aura ring - perfectly circular */}
                  <div className="absolute w-[500px] h-[500px] rounded-full animate-aura-pulse">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400/20 via-cyan-400/10 to-amber-400/20 blur-2xl" />
                  </div>

                  {/* Inner glowing backdrop - perfectly circular */}
                  <div className="absolute w-[420px] h-[420px] rounded-full animate-breathe-glow">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 via-cyan-400 to-amber-400 blur-3xl" />
                  </div>

                  {/* Main logo with meditation animation */}
                  <div className="relative animate-meditate">
                    <img
                      src="/shadanga-kriya-logo.png"
                      alt="Shadanga Kriya"
                      className="relative w-83 h-83 object-contain drop-shadow-2xl"
                    />
                  </div>

                  {/* Floating element */}
                  <div
                    className="absolute -top-8 -right-8 w-28 h-28 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg animate-float"
                    style={{ animationDelay: "0.5s" }}
                  >
                    <Sunrise className="h-8 w-8 text-white" />
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
                A Scientific Approach to
                <span className="gradient-text-brand"> Brain Mastery</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animate-delay-100">
                षडंग क्रिया is a 100% result-oriented practice designed for
                self-improvement, combining ancient Indian wisdom with modern
                brain-based techniques.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group brand-card p-8 animate-fade-in-up animation-fill-both"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
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

            {/* App Preview Card */}
            <div className="max-w-4xl mx-auto">
              <div className="brand-card p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        In This Practice You'll Learn
                      </span>
                    </div>
                    <h3 className="font-serif text-3xl font-bold text-foreground mb-4">
                      Master Your
                      <span className="gradient-text-brand block">
                        Brain & Memory
                      </span>
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Formal education provides knowledge, but for the extra
                      edge in competitive environments, you need careful
                      planning, thinking patterns, and definite goals.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "Scientific meditation process",
                        "Mechanism of brain and mind",
                        "How to develop interest in studies",
                        "Mental revision & recall techniques",
                        "Law of success & goal setting",
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
                      Start Learning Today
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>

                  <div className="hidden md:flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-br from-teal-400 to-amber-400 rounded-full animate-pulse-glow" />
                      <img
                        src="/shadanga-kriya-logo.png"
                        alt="Shadanga Kriya App"
                        className="relative w-64 h-auto object-contain animate-float-slow"
                      />
                    </div>
                  </div>
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

        {/* Outcomes Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/20 via-transparent to-muted/20" />

          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-medium mb-4 animate-fade-in">
                Outcomes
              </span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in-up">
                What You'll
                <span className="gradient-text-brand"> Achieve</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animate-delay-100">
                With the help of प्रत्योक्षकरण and क्रमवीक्षण क्रिया (The art of
                sensory acuity)
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Brain,
                  title: "Sharper Sensory Memory",
                  description:
                    "All five senses go deeper and sensory memories sharpen significantly",
                  color: "from-teal-500 to-cyan-500",
                },
                {
                  icon: Heart,
                  title: "Emotional Control",
                  description:
                    "Gain complete control over your emotions and reactions",
                  color: "from-rose-500 to-pink-500",
                },
                {
                  icon: Clock,
                  title: "Efficient Learning",
                  description:
                    "Acquire more knowledge in less time with better retention",
                  color: "from-amber-500 to-orange-500",
                },
                {
                  icon: Shield,
                  title: "Long-term Memory",
                  description:
                    "Memorised syllabus remembered for a long time without revision stress",
                  color: "from-purple-500 to-indigo-500",
                },
                {
                  icon: Star,
                  title: "Increased Confidence",
                  description:
                    "Build unshakeable self-confidence and self-reliance",
                  color: "from-cyan-500 to-blue-500",
                },
                {
                  icon: Users,
                  title: "Excel in Exams",
                  description:
                    "Develop genuine interest in studies and excel in competitive exams",
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
                  question: "What is Shadanga Kriya?",
                  answer:
                    "Shadanga Kriya is a scientific meditation practice and a frequency-based guided meditation course designed for brain and mind development. It combines ancient Indian wisdom with modern neuroscience.",
                },
                {
                  question: "What is Audio-Visual Memory?",
                  answer:
                    "Audio-Visual Memory is the science and art of memorising and visualising what one sees, listens, reads or experiences along with emotions. It's a key component of the Shadanga Kriya practice.",
                },
                {
                  question: "Why do memory challenges arise?",
                  answer:
                    "All knowledge is nothing but remembrance. Memory challenges arise not due to lack of intelligence, but due to improper operation of the brain. Shadanga Kriya teaches you to operate your brain efficiently.",
                },
                {
                  question: "Who can benefit from this practice?",
                  answer:
                    "Students, professionals, businessmen, homemakers, and elderly individuals facing memory and recall challenges can benefit from Shadanga Kriya.",
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
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-teal-500/5 to-amber-500/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 bg-gradient-to-br from-teal-400 to-amber-400 animate-pulse-glow" />
          </div>

          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
                <Heart className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">
                  Begin Your Inner Transformation
                </span>
              </div>

              <h2 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in-up">
                Ready to Rewire Your
                <span className="block gradient-text-brand">Brain & Mind?</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up animate-delay-100">
                Join thousands who have discovered clarity, focus, and emotional
                balance through Shadanga Kriya. All knowledge is nothing but
                remembrance — unlock your true potential today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-delay-200">
                <Button
                  size="lg"
                  className="brand-button-primary text-white px-10 py-6 text-lg rounded-full font-semibold shadow-xl group"
                  onClick={() => navigate("/auth?mode=signup")}
                >
                  Get Started Free
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
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                A scientific meditation system designed to improve focus,
                memory, and mental clarity through guided inner practices and
                brain-based techniques.
              </p>
              <p className="text-xs text-muted-foreground">
                Flat No. 101, Plot No. 2, Navnirman Society,
                <br />
                Ranapratap Nagar, Nagpur - 440 022
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
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span>📞</span> +91 895 639 1919
                </li>
                <li className="flex items-center gap-2">
                  <span>📞</span> +91 915 685 1919
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors">
                  Privacy Policy
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors">
                  Terms of Service
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PL Six Tele Pi Private Limited. All
              rights reserved.
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
