import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Eye,
  Target,
  Sparkles,
  Sun,
  Moon,
  Heart,
  Leaf,
} from "lucide-react";

export default function VisionMission() {
  const navigate = useNavigate();

  const missionPoints = [
    {
      icon: Heart,
      title: "Accessible Healing",
      description:
        "Make authentic therapy courses accessible to everyone, regardless of location.",
    },
    {
      icon: Leaf,
      title: "Preserve Tradition",
      description:
        "Maintain the purity of ancient practices while adapting to modern needs.",
    },
    {
      icon: Sun,
      title: "Holistic Wellness",
      description:
        "Address mind, body, and spirit through comprehensive audio-based programs.",
    },
    {
      icon: Moon,
      title: "Continuous Support",
      description:
        "Provide ongoing guidance and support throughout the healing journey.",
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
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Our Purpose
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
            Vision & Mission
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Guided by ancient wisdom, driven by modern purpose
          </p>
        </section>

        {/* Vision */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-primary/10 via-teal-500/5 to-amber-500/10 rounded-2xl border border-primary/20 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Eye className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-foreground">
                Our Vision
              </h2>
            </div>
            <p className="text-xl text-foreground leading-relaxed mb-6">
              "To be the world's leading platform for authentic audio-based
              therapy, empowering millions to achieve holistic wellness through
              the timeless practices of Shadanga Kriya."
            </p>
            <p className="text-muted-foreground">
              We envision a world where ancient healing wisdom is accessible to
              all, where technology serves as a bridge between traditional
              practices and modern lifestyles, enabling deep transformation and
              lasting well-being.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="mb-16">
          <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Target className="h-7 w-7 text-amber-500" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-foreground">
                Our Mission
              </h2>
            </div>
            <p className="text-xl text-foreground leading-relaxed mb-8">
              "To deliver transformative audio-based therapy experiences that
              heal, inspire, and elevate human consciousness through structured,
              distraction-free learning."
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {missionPoints.map((point, index) => (
                <div key={index} className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <point.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {point.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commitment */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-8">
            Our Commitment
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-6">
              <p className="text-4xl font-bold text-primary mb-2">100%</p>
              <p className="text-muted-foreground">Authentic Practices</p>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-amber-500 mb-2">24/7</p>
              <p className="text-muted-foreground">Accessible Learning</p>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-teal-500 mb-2">∞</p>
              <p className="text-muted-foreground">Continuous Support</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Button
            size="lg"
            className="brand-button-primary text-white px-8"
            onClick={() => navigate("/auth?mode=signup")}
          >
            Start Your Journey
          </Button>
        </section>
      </main>
    </div>
  );
}
