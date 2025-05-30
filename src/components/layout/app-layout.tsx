
'use client'; // Required for hooks like usePathname, useRouter, useAuth

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import SidebarNav from './sidebar-nav';
import UserNav from './user-nav';
import Logo from '@/components/icons/logo';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  // Define routes that don't use this AppLayout (e.g., login, register)
  const noAppLayoutRoutes = ['/login', '/register'];

  if (noAppLayoutRoutes.includes(pathname)) {
    return <>{children}</>; // Render children directly for auth pages
  }
  
  // Show a loading spinner for the entire page if auth state is still loading
  // and we are not on an auth page (which has its own loading state)
  if (isLoading && !noAppLayoutRoutes.includes(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }


  // If not authenticated and not on an auth route, this typically means
  // AuthContext's useEffect is handling redirect to /login.
  // So, if we reach here and not authenticated, children might be login page,
  // or we are about to be redirected.
  // If we want to strictly show nothing but login for unauth users:
  if (!isAuthenticated && !isLoading) {
     // AuthContext useEffect should handle redirecting to /login if not on an auth route.
     // So, rendering children here is fine as it might be the login page itself,
     // or the redirect will happen shortly.
     // However, for clarity, if definitely not authenticated and not loading,
     // and not an auth route (which is handled by the above check),
     // this state means user is trying to access a protected area without auth.
     // The AuthContext should redirect.
     // To prevent flash of content, we can also show a loader here.
     return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Redirecting to login...</p>
      </div>
    );
  }


  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-sidebar-primary" />
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              HR Streamline AI
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto">
          {/* Placeholder for footer content if needed */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden" />
            {/* Breadcrumbs or page title could go here */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
