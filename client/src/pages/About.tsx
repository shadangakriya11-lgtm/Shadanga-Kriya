import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Heart, Target, Users, Award, Sparkles } from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  const values = [
    {
      icon: Heart,
      title: "Pursuit of Knowledge",
      description:
        "Indian thought considers the pursuit of knowledge (ज्ञान), wisdom (प्रज्ञा), and truth (सत्य) as the highest human goal.",
      color: "primary",
    },
    {
      icon: Target,
      title: "Self-Realization",
      description:
        "Our mission is not merely to acquire knowledge, but to achieve complete self-realization and liberation with joy.",
      color: "amber-500",
    },
    {
      icon: Award,
      title: "Unique Abilities",
      description:
        "We assess, identify, and foster the unique abilities of each student, providing flexibility in their learning choices.",
      color: "teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img
              src="/shadanga-kriya-logo.png"
              alt="Shadanga Kriya"
              className="h-10 w-auto cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <section className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">About Us</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
            Start Your Inner Transformation
            <span className="block text-primary">
              Journey with Shadanga Kriya
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            In today's fast-paced life, the real challenge is not lack of
            knowledge, but lack of focus, clarity, and inner balance.
          </p>
        </section>

        {/* Main About Content */}
        <section className="mb-16">
          <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-soft animate-fade-in-up animate-delay-100">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
              About Shadanga Kriya
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">Shadanga Kriya</strong> is a
                scientifically designed meditative system that helps you operate
                your brain efficiently, strengthen sensory memory, and reconnect
                with your true inner potential for success, peace, and
                fulfillment.
              </p>
              <p>
                The fundamental principle of this activity is to assess,
                identify, and foster the unique abilities of each student and to
                provide flexibility in their choices, allowing learners to
                choose their learning direction and program, thus charting their
                path in life according to their talents and interests.
              </p>
              <p>
                With the rapidly changing employment landscape and global
                ecosystem, it is becoming increasingly important that children
                not only learn, but more importantly,
                <strong className="text-foreground"> learn how to learn</strong>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-primary/10 via-teal-500/5 to-amber-500/10 rounded-2xl border border-primary/20 p-8 animate-fade-in-up animate-delay-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Our Vision
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed mb-4">
              The rich heritage of ancient and timeless Indian wisdom and
              thought guides this activity.
            </p>
            <p className="text-muted-foreground">
              Indian thought and philosophy have always considered the pursuit
              of knowledge (ज्ञान), wisdom (प्रज्ञा), and truth (सत्य) as the
              highest human goal. The PL-6 Tele Pai Institute embraces this goal
              as its vision.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mb-16">
          <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-soft animate-fade-in-up animate-delay-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Target className="h-7 w-7 text-amber-500" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Our Mission
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed">
              The mission of this initiative is not merely to acquire knowledge
              to prepare for life in this world or after school, but to achieve
              complete self-realization and liberation with joy and happiness.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-8">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border/50 p-6 text-center shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 100 + 300}ms` }}
              >
                <div
                  className={`h-12 w-12 rounded-full bg-${value.color}/10 flex items-center justify-center mx-auto mb-4`}
                >
                  <value.icon className={`h-6 w-6 text-${value.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Organization Info */}
        <section className="mb-16">
          <div className="bg-muted/30 rounded-2xl p-8 text-center animate-fade-in-up animate-delay-500">
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Our Organization
            </h2>
            <p className="text-muted-foreground mb-2">
              <strong className="text-foreground">Shadanga Kriya</strong> - A
              Unit of PL SIX TELE PI PRIVATE LIMITED
            </p>
            <p className="text-sm text-muted-foreground">
              Flat No. 101, Plot No. 2, Navanirman Society,
              <br />
              Ranapratap Nagar, Nagpur - 440 022 (MS), India
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center animate-fade-in-up animate-delay-600">
          <Button
            size="lg"
            className="brand-button-primary text-white px-8"
            onClick={() => navigate("/auth?mode=signup")}
          >
            Begin Your Journey
          </Button>
        </section>
      </main>
    </div>
  );
}
