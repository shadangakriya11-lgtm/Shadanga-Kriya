import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, HelpCircle, User, Users, BarChart3, ArrowLeft, Mail, Lock, UserCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'learner' | 'admin' | 'facilitator';
type AuthMode = 'login' | 'signup';

const roleConfig = {
  learner: {
    icon: User,
    title: 'Learner',
    description: 'Access your therapy courses and track progress',
    color: 'bg-primary/10 text-primary',
    redirectTo: '/home'
  },
  admin: {
    icon: BarChart3,
    title: 'Administrator',
    description: 'Manage users, courses, and platform settings',
    color: 'bg-destructive/10 text-destructive',
    redirectTo: '/admin'
  },
  facilitator: {
    icon: Users,
    title: 'Facilitator',
    description: 'Supervise sessions and manage attendance',
    color: 'bg-secondary text-secondary-foreground',
    redirectTo: '/facilitator'
  }
};

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, isLoggedIn, user } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>((searchParams.get('mode') as AuthMode) || 'login');
  const [selectedRole, setSelectedRole] = useState<UserRole>((searchParams.get('role') as UserRole) || 'learner');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      navigate(roleConfig[user.role]?.redirectTo || '/home');
    }
  }, [isLoggedIn, user, navigate]);

  useEffect(() => {
    const urlMode = searchParams.get('mode') as AuthMode;
    const urlRole = searchParams.get('role') as UserRole;
    if (urlMode) setMode(urlMode);
    if (urlRole) setSelectedRole(urlRole);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup' && password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        const loggedInUser = await login(email, password);
        toast({
          title: "Welcome back!",
          description: `Signed in as ${roleConfig[loggedInUser.role]?.title || loggedInUser.role}`
        });
        navigate(roleConfig[loggedInUser.role]?.redirectTo || '/home');
      } else {
        const [firstName, ...lastNameParts] = fullName.trim().split(' ');
        const lastName = lastNameParts.join(' ') || firstName;
        
        const newUser = await register({ email, password, firstName, lastName });
        toast({
          title: "Account created!",
          description: "Your account has been created successfully."
        });
        navigate(roleConfig[newUser.role]?.redirectTo || '/home');
      }
    } catch (error: any) {
      toast({
        title: mode === 'login' ? "Login failed" : "Registration failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const RoleIcon = roleConfig[selectedRole].icon;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        </div>

        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-foreground">TherapyOS</h1>
              <p className="text-xs text-muted-foreground">Audio Therapy Platform</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-6 leading-tight">
              {mode === 'login' ? 'Welcome Back' : 'Start Your Journey'}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {mode === 'login' 
                ? 'Sign in to continue your therapy sessions and track your healing progress.'
                : 'Create your account to access disciplined, focused audio therapy designed for real results.'
              }
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Secure & Private</div>
              <div className="text-sm text-muted-foreground">Your data is encrypted and protected</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="h-12 w-12 rounded-xl bg-secondary/50 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Role-Based Access</div>
              <div className="text-sm text-muted-foreground">Tailored experience for each user type</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <ThemeToggle />
        </header>

        {/* Form */}
        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md animate-fade-in">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">TherapyOS</h1>
                <p className="text-xs text-muted-foreground">Audio Therapy Platform</p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex rounded-xl bg-muted p-1 mb-8">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'login' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'signup' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Role Selection - Only show for signup */}
            {mode === 'signup' && (
              <div className="mb-8">
                <Label className="text-sm font-medium mb-3 block">I am a...</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    return (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          selectedRole === role
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-lg ${config.color} flex items-center justify-center mx-auto mb-2`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-medium text-foreground">{config.title}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 pl-12"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-12 pr-12"
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

              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 pl-12"
                      required
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-end">
                  <button type="button" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="premium"
                size="xl"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <>
                    <RoleIcon className="h-5 w-5 mr-2" />
                    {mode === 'login' ? 'Sign In' : `Create Account`}
                  </>
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            {mode === 'login' && (
              <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                <p className="text-sm font-medium text-foreground mb-2">Demo Credentials:</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Admin: admin@therapyos.com / admin123</p>
                  <p>Facilitator: facilitator@therapyos.com / facilitator123</p>
                  <p>Learner: learner@therapyos.com / learner123</p>
                </div>
              </div>
            )}

            {/* Help section for learners */}
            {selectedRole === 'learner' && mode === 'signup' && (
              <div className="mt-8 p-4 bg-muted/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Need access?</p>
                    <p className="text-sm text-muted-foreground">
                      Contact your administrator or facilitator to receive your login credentials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Switch mode */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-primary font-medium hover:underline"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 TherapyOS. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
