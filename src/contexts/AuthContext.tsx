import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, setAuthToken, removeAuthToken, isAuthenticated } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'learner' | 'admin' | 'facilitator';
  phone?: string;
  userId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch (error) {
      removeAuthToken();
      setUser(null);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const response = await authApi.login(email, password);
    setAuthToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string }): Promise<User> => {
    const response = await authApi.register(data);
    setAuthToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    toast({ title: 'Logged out successfully' });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isLoggedIn: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
