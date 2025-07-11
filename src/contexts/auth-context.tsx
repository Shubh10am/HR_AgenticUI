
'use client';

import type { EmployeeRole } from '@/models/Employee';
import type { AdminRole } from '@/models/Admin';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole | AdminRole; // Combined roles
  organizationId: string | null; // Can be null for SuperAdmins
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  userApiKey: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (values: Record<string, string>) => Promise<boolean>;
  register: (values: Record<string, string>) => Promise<boolean>;
  loginAsGuest: () => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  setUserApiKey: (key: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A flag to manage the guest login transition and prevent race conditions.
let isGuestTransitioning = false;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true to check auth on load
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const clearAttendanceLocalStorage = () => {
    localStorage.removeItem('hrStreamlineClockInStatus');
    localStorage.removeItem('hrStreamlineClockInTime');
  };

  const fetchAndSetUserApiKey = async (userToken: string) => {
    if (!userToken || userToken.startsWith('guest-')) {
      localStorage.removeItem('userApiKey');
      setUserApiKey(null);
      return;
    }
    try {
      const response = await fetch('/api/settings/api-key', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.apiKey) {
          localStorage.setItem('userApiKey', data.apiKey);
          setUserApiKey(data.apiKey);
        } else {
          localStorage.removeItem('userApiKey');
          setUserApiKey(null);
        }
      } else {
        localStorage.removeItem('userApiKey');
        setUserApiKey(null);
      }
    } catch (e) {
      console.error("Failed to fetch user API key", e);
      localStorage.removeItem('userApiKey');
      setUserApiKey(null);
    }
  };
  
  const logout = useCallback(() => {
    isGuestTransitioning = false; // Reset on logout
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('userApiKey');
    clearAttendanceLocalStorage();
    setToken(null);
    setUser(null);
    setUserApiKey(null);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
  }, [router, toast]);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);

            if (!storedToken.startsWith('guest-') && parsedUser.role !== 'SuperAdmin') {
                await fetchAndSetUserApiKey(storedToken);
            } else {
                setUserApiKey(null);
            }
        } catch (e) {
            console.error("Failed to parse stored user:", e);
            logout();
        }
    } else {
      setUser(null);
      setToken(null);
      setUserApiKey(null);
      clearAttendanceLocalStorage();
    }
    setIsLoading(false);
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  useEffect(() => {
    if (isLoading || isGuestTransitioning) { // Prevent routing logic while loading or transitioning to guest
      return;
    }

    const isRealUser = !!user && !!token && !token.startsWith('guest-');
    
    const authRoutes = ['/login', '/register'];
    const isOnAuthRoute = authRoutes.includes(pathname);
    
    const publicPages = ['/', '/login', '/register', '/contact', '/book-a-demo'];
    const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/legal') || pathname.startsWith('/blog') || pathname.startsWith('/docs');
    const isAdminRoute = pathname.startsWith('/admin');
    
    if (isRealUser && isOnAuthRoute) {
      router.push('/dashboard');
      return;
    }

    if (!user && !token && !isPublicPage && !isAdminRoute) {
      router.push('/login');
      return;
    }

  }, [user, token, isLoading, pathname, router]);


  const login = async (values: Record<string, string>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
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
      
      clearAttendanceLocalStorage();
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      if (data.user.role !== 'SuperAdmin') {
        await fetchAndSetUserApiKey(data.token);
      }
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
      const response = await fetch('/api/auth/register', {
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
      
      clearAttendanceLocalStorage(); 
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
    isGuestTransitioning = true; // Set flag to pause routing logic
    setIsLoading(true);
    
    clearAttendanceLocalStorage();
    localStorage.removeItem('userApiKey');
    setUserApiKey(null);

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
    
    // Instead of pushing directly, let the useEffect handle the redirection
    // after the state has been properly set.
    router.push('/dashboard', { scroll: false });
    
    // Allow state to update and useEffect to run before resetting flags
    setTimeout(() => {
        isGuestTransitioning = false;
        setIsLoading(false);
    }, 50); // A small delay is usually sufficient

    return true;
  };
  
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, userApiKey, isLoading, isAuthenticated, login, register, loginAsGuest, logout, checkAuth, setUserApiKey }}>
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
