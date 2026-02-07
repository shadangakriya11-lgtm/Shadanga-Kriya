import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  HelpCircle,
  User,
  Users,
  BarChart3,
  ArrowLeft,
  Mail,
  Lock,
  UserCircle,
  Sparkles,
  Sunrise,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ConsentFormDialog } from "@/components/ConsentFormDialog";
import { Capacitor } from "@capacitor/core";

type UserRole = "learner" | "admin" | "facilitator";
type AuthMode = "login" | "signup";

const roleConfig = {
  learner: {
    icon: User,
    title: "Practitioner",
    description: "Access guided meditation and track your spiritual journey",
    color: "bg-gradient-to-br from-teal-500 to-cyan-500",
    textColor: "text-teal-600 dark:text-teal-400",
    redirectTo: "/home",
  },
  admin: {
    icon: BarChart3,
    title: "Administrator",
    description: "Manage users, courses, and platform settings",
    color: "bg-gradient-to-br from-amber-500 to-orange-500",
    textColor: "text-amber-600 dark:text-amber-400",
    redirectTo: "/admin",
  },
  facilitator: {
    icon: Users,
    title: "Facilitator",
    description: "Supervise sessions and guide practitioners",
    color: "bg-gradient-to-br from-teal-600 to-teal-400",
    textColor: "text-teal-700 dark:text-teal-300",
    redirectTo: "/facilitator",
  },
};

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, isLoggedIn, user } = useAuth();

  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get("mode") as AuthMode) || "login"
  );
  const selectedRole: UserRole = "learner";
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const isNativePlatform = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isLoggedIn && user) {
      navigate(roleConfig[user.role]?.redirectTo || "/home");
    }
  }, [isLoggedIn, user, navigate]);

  useEffect(() => {
    const urlMode = searchParams.get("mode") as AuthMode;
    if (urlMode) setMode(urlMode);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup" && password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "signup" && password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "signup") {
      setShowConsentDialog(true);
      return;
    }

    await performAuth();
  };

  const handleConsentAccepted = async () => {
    setShowConsentDialog(false);
    await performAuth();
  };

  const performAuth = async () => {
    setIsLoading(true);

    try {
      if (mode === "login") {
        const loggedInUser = await login(email, password);
        toast({
          title: "Namaste! Welcome back 🙏",
          description: `Signed in as ${roleConfig[loggedInUser.role]?.title || loggedInUser.role}`,
        });
        navigate(roleConfig[loggedInUser.role]?.redirectTo || "/home");
      } else {
        const [firstName, ...lastNameParts] = fullName.trim().split(" ");
        const lastName = lastNameParts.join(" ") || firstName;

        const newUser = await register({
          email,
          password,
          firstName,
          lastName,
          referralCode: referralCode || undefined,
        });
        toast({
          title: "Welcome to Shadanga Kriya! 🙏",
          description: "Your account has been created successfully.",
        });
        navigate(roleConfig[newUser.role]?.redirectTo || "/home");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Please check your credentials and try again.";
      toast({
        title: mode === "login" ? "Login failed" : "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const RoleIcon = roleConfig[selectedRole].icon;

  // Native App - Custom Design
  if (isNativePlatform) {
    return (
      <div className="min-h-screen bg-background flex flex-col overflow-hidden">
        {/* Fixed Header Buttons - Outside curved area for proper touch */}
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => navigate("/")}
            className="p-2.5 rounded-full bg-white/30 backdrop-blur-sm text-white shadow-lg active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Curved Header with Gradient */}
        <div className="relative">
          <div
            className="h-44 bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500"
            style={{
              borderBottomLeftRadius: '50% 30%',
              borderBottomRightRadius: '50% 30%',
            }}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{
              borderBottomLeftRadius: '50% 30%',
              borderBottomRightRadius: '50% 30%',
            }}>
              <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 blur-xl" />
              <div className="absolute top-20 right-16 w-16 h-16 rounded-full bg-white/10 blur-xl" />
              <div className="absolute bottom-8 left-1/4 w-24 h-24 rounded-full bg-teal-400/20 blur-2xl" />
            </div>

            {/* Logo - Inside gradient */}
            <div className="absolute inset-x-0 top-10 flex items-center justify-center pointer-events-none">
              <div className="bg-card/90 dark:bg-card/80 backdrop-blur-sm rounded-full p-2 shadow-xl border border-border/20">
                <img
                  src="/shadanga-kriya-logo.png"
                  alt="Shadanga Kriya"
                  className="h-20 w-20 object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 pt-4 relative z-10">
          {/* Welcome Text - Below header */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {mode === "login" ? "Welcome Back" : "Get Started Free"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Enter your details below"
                : "Create your account to begin"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm text-muted-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 pl-10 rounded-xl border border-border bg-card focus:border-primary focus:ring-1 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10 rounded-xl border border-border bg-card focus:border-primary focus:ring-1 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10 pr-10 rounded-xl border border-border bg-card focus:border-primary focus:ring-1 focus:ring-primary/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pl-10 rounded-xl border border-border bg-card focus:border-primary focus:ring-1 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="referralCode" className="text-sm text-muted-foreground">
                  Referral Code (Optional)
                </Label>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="h-12 pl-10 rounded-xl border border-border bg-card focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-primary font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-base shadow-lg shadow-teal-500/25 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                mode === "login" ? "Sign In" : "Sign Up"
              )}
            </Button>
          </form>

          {/* Switch Mode */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary font-semibold"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        <ConsentFormDialog
          open={showConsentDialog}
          onClose={() => setShowConsentDialog(false)}
          onAccept={handleConsentAccepted}
        />
      </div>
    );
  }

  // Web Design
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-800" />

        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-30 animate-float-slow"
            style={{
              background: "radial-gradient(circle, hsl(174 65% 50% / 0.5) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-20 animate-float"
            style={{
              background: "radial-gradient(circle, hsl(38 85% 55% / 0.5) 0%, transparent 70%)",
              animationDelay: "2s",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-25 animate-pulse-gentle"
            style={{
              background: "radial-gradient(circle, hsl(180 50% 45% / 0.4) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <div>
            <div
              className="flex items-center gap-4 mb-16 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <img
                src="/shadanga-kriya-logo.png"
                alt="Shadanga Kriya"
                className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <div className="max-w-md animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-medium text-white/90">
                  {mode === "login" ? "Continue Your Journey" : "Begin Your Transformation"}
                </span>
              </div>

              <h2 className="font-serif text-4xl font-bold text-white mb-6 leading-tight">
                {mode === "login" ? (
                  <>
                    Welcome Back,
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100">
                      Seeker
                    </span>
                  </>
                ) : (
                  <>
                    Discover Your
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100">
                      Inner Light
                    </span>
                  </>
                )}
              </h2>
              <p className="text-lg text-white/70 leading-relaxed">
                {mode === "login"
                  ? "Sign in to continue your practice and track your progress on the path to inner peace."
                  : "Create your account to access authentic Shadanga Kriya practices and begin your healing journey."}
              </p>
            </div>
          </div>

          <div className="space-y-4 animate-fade-in-up animation-fill-both animate-delay-300">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center">
                <Sunrise className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Guided Practice</div>
                <div className="text-sm text-white/60">Audio-guided meditation sessions</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Focused Experience</div>
                <div className="text-sm text-white/60">Zero distractions for deep practice</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 -z-10 brand-gradient-bg" />
        <div
          className="absolute top-20 right-10 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{
            background: "radial-gradient(circle, hsl(174 65% 40%) 0%, transparent 70%)",
          }}
        />

        <header className="sticky top-0 z-50 p-4 sm:p-6 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md animate-fade-in">
            <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
              <img
                src="/shadanga-kriya-logo.png"
                alt="Shadanga Kriya"
                className="h-16 w-auto"
              />
            </div>

            <div className="flex rounded-2xl bg-muted/50 p-1.5 backdrop-blur-sm border border-border/50 mb-8">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${mode === "login"
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${mode === "signup"
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                  <div className="relative group">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-14 pl-12 rounded-xl border-2 border-border bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 pl-12 rounded-xl border-2 border-border bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 pl-12 pr-12 rounded-xl border-2 border-border bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-14 pl-12 rounded-xl border-2 border-border bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="referralCode" className="text-foreground">Referral Code (Optional)</Label>
                  <div className="relative group">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="referralCode"
                      type="text"
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="h-14 pl-12 rounded-xl border-2 border-border bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 brand-button-primary text-white rounded-xl font-semibold text-base shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  <>
                    <RoleIcon className="h-5 w-5 mr-2" />
                    {mode === "login" ? "Sign In" : "Begin Your Journey"}
                  </>
                )}
              </Button>
            </form>

            {mode === "signup" && (
              <div className="mt-8 p-5 bg-muted/50 rounded-2xl border border-border/50 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Need guidance?</p>
                    <p className="text-sm text-muted-foreground">
                      Contact your facilitator or administrator for personalized access to courses.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              {mode === "login" ? "New to Shadanga Kriya? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary font-semibold hover:text-primary/80 hover:underline transition-colors"
              >
                {mode === "login" ? "Create Account" : "Sign In"}
              </button>
            </p>
          </div>
        </main>

        <footer className="py-6 text-center">
          <p className="text-xs text-muted-foreground">© 2024 Shadanga Kriya. All rights reserved.</p>
        </footer>
      </div>

      <ConsentFormDialog
        open={showConsentDialog}
        onClose={() => setShowConsentDialog(false)}
        onAccept={handleConsentAccepted}
      />
    </div>
  );
}
