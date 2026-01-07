import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle,
  Sparkles,
  KeyRound,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Check if we have a reset token in URL
  const resetToken = searchParams.get("token");
  const isResetMode = !!resetToken;

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      setIsSuccess(true);
      // For demo, show the reset link
      if (data.demo_reset_link) {
        setResetLink(data.demo_reset_link);
      }

      toast({
        title: "Reset link sent",
        description:
          "If this email exists in our system, you will receive a password reset link.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setIsSuccess(true);

      toast({
        title: "Password reset successful",
        description: "You can now login with your new password.",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error) {
      toast({
        title: "Reset failed",
        description:
          error instanceof Error ? error.message : "Invalid or expired token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 brand-gradient-bg" />
      <div
        className="absolute top-20 right-10 w-64 h-64 rounded-full blur-3xl opacity-10"
        style={{
          background:
            "radial-gradient(circle, hsl(174 65% 40%) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-20 left-10 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{
          background:
            "radial-gradient(circle, hsl(38 85% 55% / 0.3) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth")}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <img
              src="/shadanga-kriya-logo.png"
              alt="Shadanga Kriya"
              className="h-16 w-auto cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Success state for forgot password */}
          {isSuccess && !isResetMode && (
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  Check Your Email
                </h2>
                <p className="text-muted-foreground">
                  If an account exists with {email}, we&apos;ve sent a password
                  reset link.
                </p>
              </div>

              {/* Demo: Show reset link */}
              {resetLink && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Demo Mode - Reset Link:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      const url = new URL(resetLink);
                      navigate(
                        `/forgot-password?token=${url.searchParams.get(
                          "token"
                        )}`
                      );
                    }}
                  >
                    <KeyRound className="h-3 w-3 mr-2" />
                    Click here to reset password
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="text-primary hover:text-primary/80"
              >
                Return to Login
              </Button>
            </div>
          )}

          {/* Success state for reset password */}
          {isSuccess && isResetMode && (
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  Password Reset!
                </h2>
                <p className="text-muted-foreground">
                  Your password has been updated. Redirecting to login...
                </p>
              </div>
            </div>
          )}

          {/* Forgot Password Form */}
          {!isSuccess && !isResetMode && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  Forgot Password?
                </h2>
                <p className="text-muted-foreground">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 pl-12 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 brand-button-primary text-white rounded-xl font-semibold text-base shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Reset Password Form */}
          {!isSuccess && isResetMode && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  Reset Password
                </h2>
                <p className="text-muted-foreground">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground">
                    New Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-14 pl-12 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-14 pl-12 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 brand-button-primary text-white rounded-xl font-semibold text-base shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Back to login link */}
          {!isSuccess && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="text-primary font-semibold hover:text-primary/80 hover:underline transition-colors"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2024 Shadanga Kriya. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
