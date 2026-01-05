import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate('/auth'), 300);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 flex flex-col items-center justify-center px-6">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-breathe" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-success/5 rounded-full blur-3xl animate-breathe" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-gentle" />
      </div>

      {/* Logo & Content */}
      <div className="relative z-10 text-center animate-fade-in">
        {/* Logo */}
        <div className="relative mx-auto mb-8">
          <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto animate-breathe">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -inset-4 rounded-[2rem] bg-primary/5 blur-xl -z-10" />
        </div>

        {/* Brand */}
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
          TherapyOS
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          Audio Therapy Platform
        </p>

        {/* Tagline */}
        <p className="font-serif text-xl text-primary/80 italic max-w-xs mx-auto mb-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
          "Discipline in listening,
          <br />
          healing in practice"
        </p>

        {/* Loading Progress */}
        <div className="w-48 mx-auto">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 animate-pulse-gentle">
            Preparing your session...
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-muted-foreground">
          Protocol-driven audio therapy
        </p>
      </div>
    </div>
  );
}
