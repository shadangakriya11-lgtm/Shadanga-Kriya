import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Heart, Target, Users, Award, Sparkles } from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  const team = [
    {
      name: "Dr. Rajesh Sharma",
      role: "Founder & Lead Instructor",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      bio: "30+ years of experience in traditional yogic practices and therapy.",
    },
    {
      name: "Priya Mehta",
      role: "Program Director",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      bio: "Certified yoga therapist specializing in audio-based healing.",
    },
    {
      name: "Amit Patel",
      role: "Technical Lead",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      bio: "Building technology solutions for mindful wellness.",
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
            <span className="text-sm font-medium text-primary">About Us</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
            Transforming Lives Through
            <span className="block text-primary">Ancient Wisdom</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Shadanga Kriya is a unit of PL Six Tele Pi Private Limited,
            dedicated to bringing authentic audio-based therapy courses to
            practitioners worldwide.
          </p>
        </section>

        {/* Organization Info */}
        <section className="mb-16">
          <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-soft">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
              Our Organization
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">Shadanga Kriya</strong> - A
                Unit of PL SIX TELE PI PRIVATE LIMITED
              </p>
              <p>
                Flat No. 101, Plot No. 2, Navanirman Society,
                <br />
                Ranapratap Nagar, Nagpur - 440 022 (MS), India
              </p>
              <p>
                Founded with the mission to make authentic yogic practices
                accessible to everyone through modern technology, we combine
                traditional wisdom with innovative audio-based therapy
                approaches.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-8">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl border border-border/50 p-6 text-center shadow-soft">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Compassion</h3>
              <p className="text-sm text-muted-foreground">
                We approach every practitioner with understanding and care.
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-6 text-center shadow-soft">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Authenticity
              </h3>
              <p className="text-sm text-muted-foreground">
                True to ancient practices while embracing modern delivery.
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-6 text-center shadow-soft">
              <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6 text-teal-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Excellence</h3>
              <p className="text-sm text-muted-foreground">
                Committed to the highest standards in therapy and technology.
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-8">
            <Users className="h-6 w-6 inline-block mr-2 text-primary" />
            Our Team
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border/50 p-6 text-center shadow-soft"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-24 w-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-primary mb-2">{member.role}</p>
                <p className="text-xs text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Button
            size="lg"
            className="brand-button-primary text-white px-8"
            onClick={() => navigate("/auth?mode=signup")}
          >
            Join Our Community
          </Button>
        </section>
      </main>
    </div>
  );
}
