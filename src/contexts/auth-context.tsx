
'use client';

import type { EmployeeRole } from '@/models/Employee';
import type { AdminRole } from '@/models/Admin';
import type { OrganizationStatus } from '@/models/Organization'; // Import OrganizationStatus
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole | AdminRole;
  organizationId: string | null;
  organizationStatus: OrganizationStatus | null; // Add organization status
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

// --- API Interceptor ---
// We patch the global fetch to intercept 401 responses.
// This is a simple way to handle token expiration globally.
let isInterceptorSetup = false;

const setupFetchInterceptor = (logoutCallback: () => void) => {
    if (isInterceptorSetup || typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);

        if (response.status === 401) {
            // Don't intercept the login endpoint itself on a 401, as that's expected for wrong passwords.
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;
            if (!url.includes('/api/auth/login')) {
                console.log('API interceptor: Detected 401, logging out.');
                logoutCallback();
                // Throw an error to prevent the original caller from processing a bad response
                throw new Error('Session expired. Please log in again.');
            }
        }
        return response;
    };
    isInterceptorSetup = true;
};


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

  // Setup the global API interceptor on mount
  useEffect(() => {
    setupFetchInterceptor(logout);
  }, [logout]);


  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);

            // Fetch API key only for real, non-SuperAdmin users.
            if (!storedToken.startsWith('guest-') && parsedUser.role !== 'SuperAdmin') {
                // Fire and forget - do not await
                fetchAndSetUserApiKey(storedToken);
            } else {
                localStorage.removeItem('userApiKey');
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
        fetchAndSetUserApiKey(data.token);
      }
      
      toast({ title: 'Login Successful', description: 'Welcome back!' });

      setIsLoading(false); 

      if (data.user.role === 'SuperAdmin') {
        localStorage.setItem('adminAuthToken', data.token);
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard'); 
      }
      
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
    isGuestTransitioning = true;
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
      organizationStatus: 'Active',
    };
    const guestToken = 'guest-auth-token-' + Date.now(); 

    localStorage.setItem('authToken', guestToken);
    localStorage.setItem('authUser', JSON.stringify(guestUser));
    setToken(guestToken);
    setUser(guestUser);
    
    toast({ title: 'Continuing as Guest', description: 'Welcome! Some features may be limited.' });
    
    router.push('/dashboard', { scroll: false });
    
    setTimeout(() => {
        isGuestTransitioning = false;
        setIsLoading(false);
    }, 50);

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
