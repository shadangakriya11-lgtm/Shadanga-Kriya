import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  authApi,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  getCachedToken,
  initializeAuth,
  isAuthInitialized,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { User } from "@/types";



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
    referralCode?: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Local storage key for persisting user profile between reloads (web)
const USER_STORAGE_KEY = "shadanga_kriya_auth_user";

const saveUserToStorage = (profile: User | null) => {
  try {
    if (profile) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (e) {
    // Ignore storage errors (e.g., private mode)
  }
};

const loadUserFromStorage = (): User | null => {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch (e) {
    return null;
  }
};

const clearUserFromStorage = () => saveUserToStorage(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from persisted token
  useEffect(() => {
    const initAuth = async () => {
      console.log("[AuthContext] Starting auth initialization...");

      // Wait for auth to be initialized (token loaded from storage)
      if (!isAuthInitialized()) {
        console.log("[AuthContext] Auth not initialized yet, initializing...");
        await initializeAuth();
      }

      console.log("[AuthContext] Checking authentication status...");
      const hasToken = isAuthenticated();
      const cachedToken = getCachedToken();
      console.log(
        "[AuthContext] Has token:",
        hasToken,
        "Token preview:",
        cachedToken ? cachedToken.substring(0, 20) + "..." : "none"
      );

      if (hasToken) {
        // Use cached user immediately to avoid redirect flicker
        const cachedUser = loadUserFromStorage();
        if (cachedUser) {
          console.log("[AuthContext] Loaded cached user from storage");
          setUser(cachedUser);
        }

        try {
          console.log("[AuthContext] Token found, fetching user profile...");
          await refreshUser();
          console.log("[AuthContext] User profile loaded successfully");
        } catch (error: any) {
          console.error("[AuthContext] Failed to load user profile:", error);
          // Only clear token if it's an auth error (handled in refreshUser)
          // For network errors, keep the user logged out but don't clear the token
          // so they can retry when network is back
          const isNetworkError =
            error?.message?.toLowerCase().includes("network") ||
            error?.message?.toLowerCase().includes("failed to fetch") ||
            error?.name === "TypeError";
          if (isNetworkError) {
            console.log(
              "[AuthContext] Network error - token preserved for retry"
            );
            // Keep token and cached user; allow retry on next request
          }
          // Auth errors are already handled in refreshUser
        }
      } else {
        console.log("[AuthContext] No token found, user is not logged in");
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const refreshUser = async () => {
    try {
      const profile = await authApi.getProfile();
      console.log(
        "[AuthContext] Profile fetched - full object:",
        JSON.stringify(profile)
      );
      console.log("[AuthContext] Profile email:", profile?.email);
      setUser(profile);
      saveUserToStorage(profile);
    } catch (error: any) {
      console.error("[AuthContext] Error fetching profile:", error);
      const errorMessage = error?.message || "";
      const isAuthError =
        errorMessage.startsWith("401") ||
        errorMessage.toLowerCase().includes("unauthorized") ||
        errorMessage.toLowerCase().includes("invalid token") ||
        errorMessage.toLowerCase().includes("jwt");
      if (isAuthError) {
        console.log("[AuthContext] Auth error detected, clearing token");
        await removeAuthToken();
        setUser(null);
        clearUserFromStorage();
      }
      const isParseError =
        error instanceof SyntaxError ||
        errorMessage.includes("Unexpected token");
      if (isParseError) {
        console.log(
          "[AuthContext] Non-JSON response (likely HTML) - keeping token and cached user"
        );
        // Keep token and cached user; backend likely returned HTML error page
      }
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    console.log("[AuthContext] Logging in user:", email);
    const response = await authApi.login(email, password);

    // Save token to persistent storage (async)
    await setAuthToken(response.token);
    console.log("[AuthContext] Token saved, setting user");

    setUser(response.user);
    saveUserToStorage(response.user);
    return response.user;
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    referralCode?: string;
  }): Promise<User> => {
    console.log("[AuthContext] Registering user:", data.email);
    const response = await authApi.register(data);

    // Save token to persistent storage (async)
    await setAuthToken(response.token);
    console.log("[AuthContext] Token saved after registration");

    setUser(response.user);
    saveUserToStorage(response.user);
    return response.user;
  };

  const logout = async () => {
    console.log("[AuthContext] Logging out...");
    await removeAuthToken();
    setUser(null);
    clearUserFromStorage();
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
