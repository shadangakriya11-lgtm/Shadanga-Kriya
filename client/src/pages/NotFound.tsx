import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center px-4">
        <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
        <p className="mb-8 text-sm text-muted-foreground max-w-sm mx-auto">
          The page you're looking for doesn't exist or you may have been logged out.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <a href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Return to Home
            </a>
          </Button>

          {isLoggedIn && (
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout & Re-login
            </Button>
          )}

          {!isLoggedIn && (
            <Button asChild variant="outline">
              <a href="/login" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Go to Login
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
