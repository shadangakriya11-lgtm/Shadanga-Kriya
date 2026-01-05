import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  authApi,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  initializeAuth,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "learner" | "admin" | "facilitator";
  phone?: string;
  userId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      console.log("[AuthContext] Refreshing user profile...");
      const profile = await authApi.getProfile();
      setUser(profile);
      console.log("[AuthContext] User profile refreshed:", profile.email);
    } catch (error) {
      console.log("[AuthContext] Failed to refresh user, clearing token");
      await removeAuthToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Initialize auth from localStorage on app start
    const init = async () => {
      console.log("[AuthContext] Initializing auth...");
      const hasToken = await initializeAuth();
      console.log("[AuthContext] Token found:", hasToken);

      if (hasToken && isAuthenticated()) {
        await refreshUser();
      }
      setIsLoading(false);
    };
    init();
  }, [refreshUser]);

  // Listen for visibility changes to refresh auth when app comes back to foreground
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isAuthenticated()) {
        console.log("[AuthContext] App visible, checking auth state...");
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
        } catch (error) {
          console.log("[AuthContext] Auth invalid, clearing");
          await removeAuthToken();
          setUser(null);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await authApi.login(email, password);
    await setAuthToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> => {
    const response = await authApi.register(data);
    await setAuthToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const logout = async () => {
    await removeAuthToken();
    setUser(null);
    toast({ title: "Logged out successfully" });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
