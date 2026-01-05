import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  HelpCircle,
  Sparkles,
  Heart,
  Sunrise,
} from "lucide-react";

export default function LearnerLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 brand-gradient-bg" />
        <div
          className="absolute top-10 left-5 w-64 h-64 rounded-full blur-3xl opacity-30 animate-float-slow"
          style={{
            background:
              "radial-gradient(circle, hsl(174 65% 40% / 0.4) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-20 right-5 w-48 h-48 rounded-full blur-3xl opacity-25 animate-float"
          style={{
            background:
              "radial-gradient(circle, hsl(38 85% 55% / 0.4) 0%, transparent 70%)",
            animationDelay: "1.5s",
          }}
        />
        <div
          className="absolute top-1/3 right-10 w-32 h-32 rounded-full blur-2xl opacity-20 animate-pulse-gentle"
          style={{
            background:
              "radial-gradient(circle, hsl(180 50% 45% / 0.5) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="p-6 relative z-10">
        <div
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <img
            src="/shadanga-kriya-logo.png"
            alt="Shadanga Kriya"
            className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12 relative z-10">
        <div className="w-full max-w-sm">
          {/* Welcome Section */}
          <div className="text-center mb-10 animate-fade-in">
            {/* Decorative icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 mb-6 shadow-lg animate-breathe">
              <Sunrise className="h-10 w-10 text-white" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Welcome Back
              </span>
            </div>

            <h2 className="font-serif text-3xl font-bold text-foreground mb-3">
              Continue Your
              <span className="block gradient-text-brand">Journey Within</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Sign in to access your personalized meditation practice
            </p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-5 animate-fade-in-up animation-fill-both animate-delay-200"
          >
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-foreground font-medium">
                User ID
              </Label>
              <div className="relative group">
                <Input
                  id="userId"
                  type="text"
                  placeholder="Enter your user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="h-14 px-4 rounded-2xl border-2 border-border bg-card/80 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 px-4 pr-12 rounded-2xl border-2 border-border bg-card/80 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 brand-button-primary text-white rounded-2xl font-semibold text-base shadow-lg mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <Heart className="h-5 w-5 mr-2" />
                  Begin Practice
                </>
              )}
            </Button>
          </form>

          {/* Help Section */}
          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 animate-fade-in-up animation-fill-both animate-delay-400">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-md">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Need access?
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Contact your facilitator or administrator to receive your
                  login credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Go to main login */}
          <div className="mt-6 text-center animate-fade-in animate-delay-500">
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Need more options?{" "}
              <span className="text-primary font-semibold hover:underline">
                Full Sign In
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center relative z-10">
        <p className="text-xs text-muted-foreground">
          © 2024 Shadanga Kriya. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
