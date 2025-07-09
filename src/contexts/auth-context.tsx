
'use client';

import type { EmployeeRole } from '@/models/Employee';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// This will be undefined if not set in the environment, which is handled by the logic below.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
  loginAsGuest: () => Promise<boolean>;
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

  const clearAttendanceLocalStorage = () => {
    localStorage.removeItem('hrStreamlineClockInStatus');
    localStorage.removeItem('hrStreamlineClockInTime');
  };

  const checkAuth = useCallback(() => {
    setIsLoading(true);
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      // Check if the token is a guest token.
      if (storedToken.startsWith('guest-auth-token-')) {
        // If it is a guest token, we treat the session as expired on a full page reload.
        // This forces the user to click "Continue as Guest" again.
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        clearAttendanceLocalStorage();
        setUser(null);
        setToken(null);
      } else {
        // It's a real user's token, proceed with authentication.
        setToken(storedToken);
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error("Failed to parse stored user:", e);
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          clearAttendanceLocalStorage();
          setUser(null);
          setToken(null);
        }
      }
    } else {
      // No token found, ensure user is logged out.
      setUser(null);
      setToken(null);
      clearAttendanceLocalStorage();
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  useEffect(() => {
    if (!isLoading) {
      const isAuthenticatedUser = !!user && !!token;
      
      const publicOnlyRoutes = ['/login', '/register'];
      const publicRoutes = ['/login', '/register', '/', '/contact'];
      
      const isPublicOnlyRoute = publicOnlyRoutes.includes(pathname);
      const isPublicRoute = publicRoutes.includes(pathname);

      if (isAuthenticatedUser && isPublicOnlyRoute) {
        // If logged in, redirect from login/register to dashboard
        router.push('/dashboard'); 
      } else if (!isAuthenticatedUser && !isPublicRoute) {
        // If not logged in and not on a public route, redirect to login
        router.push('/login'); 
      }
    }
  }, [user, token, isLoading, pathname, router]);


  const login = async (values: Record<string, string>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const endpoint = '/api/auth/login';
      let requestUrl = endpoint;
      if (API_BASE_URL) {
        requestUrl = `${API_BASE_URL.replace(/\/$/, '')}${endpoint}`;
      }
      
      const response = await fetch(requestUrl, {
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
      
      clearAttendanceLocalStorage(); // Clear previous user's attendance state
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/dashboard'); 
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Login Error', description: 'An unexpected error occurred during login.', variant: 'destructive' });
      setIsLoading(false);
      return false;
    }
  };

  const register = async (values: Record<string, string>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const endpoint = '/api/auth/register';
      let requestUrl = endpoint;
      if (API_BASE_URL) {
        requestUrl = `${API_BASE_URL.replace(/\/$/, '')}${endpoint}`;
      }
      
      const response = await fetch(requestUrl, {
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
      
      clearAttendanceLocalStorage(); // Clear any potential attendance state before redirecting to login
      toast({ title: 'Registration Successful', description: 'Please log in with your new credentials.' });
      router.push('/login'); 
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({ title: 'Registration Error', description: 'An unexpected error occurred during registration.', variant: 'destructive' });
      setIsLoading(false);
      return false;
    }
  };

  const loginAsGuest = async (): Promise<boolean> => {
    setIsLoading(true);
    
    clearAttendanceLocalStorage(); // Ensure guest session starts clean

    const guestUser: User = {
      id: 'guest-user-id-' + Date.now(), 
      name: 'Guest User',
      email: 'guest@hrstreamline.ai',
      role: 'Employee' as EmployeeRole, 
      organizationId: 'guest-org-id',
    };
    const guestToken = 'guest-auth-token-' + Date.now(); 

    localStorage.setItem('authToken', guestToken);
    localStorage.setItem('authUser', JSON.stringify(guestUser));
    setToken(guestToken);
    setUser(guestUser);
    
    toast({ title: 'Continuing as Guest', description: 'Welcome! Some features may be limited.' });
    router.push('/dashboard');
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    clearAttendanceLocalStorage(); // Clear attendance state on logout
    setToken(null);
    setUser(null);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login'); 
  };
  
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, register, loginAsGuest, logout, checkAuth }}>
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
