
'use client';

import type { EmployeeRole } from '@/models/Employee';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Use an empty string as default. If NEXT_PUBLIC_API_URL is not set in the environment,
// fetch will use relative paths (e.g., /api/auth/login), which is correct for same-origin deployments.
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface User {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  organizationId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (values: Record<string, string>) => Promise<boolean>;
  register: (values: Record<string, string>) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true to check auth on load
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const checkAuth = useCallback(() => {
    setIsLoading(true);
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
      setToken(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  // Handle redirection after auth state is determined
  useEffect(() => {
    if (!isLoading) {
      const isAuthenticated = !!user && !!token;
      const authRoutes = ['/login', '/register'];
      const isAuthRoute = authRoutes.includes(pathname);

      if (isAuthenticated && isAuthRoute) {
        router.push('/'); // Redirect to dashboard if logged in and on an auth page
      } else if (!isAuthenticated && !isAuthRoute) {
        router.push('/login'); // Redirect to login if not logged in and not on an auth page
      }
    }
  }, [user, token, isLoading, pathname, router]);


  const login = async (values: Record<string, string>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({ title: 'Login Failed', description: data.error || 'Invalid credentials.', variant: 'destructive' });
        setIsLoading(false);
        return false;
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/'); // Redirect to dashboard
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Login Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      setIsLoading(false);
      return false;
    }
  };

  const register = async (values: Record<string, string>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({ title: 'Registration Failed', description: data.error || 'Could not register.', variant: 'destructive' });
        setIsLoading(false);
        return false;
      }

      toast({ title: 'Registration Successful', description: 'Please log in with your new credentials.' });
      router.push('/login'); // Redirect to login page
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({ title: 'Registration Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login'); // Redirect to login page
  };
  
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

