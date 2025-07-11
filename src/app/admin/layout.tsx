
'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebarNav from './components/admin-sidebar-nav';
import Logo from '@/components/icons/logo';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context'; // Using the main app's auth context
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth(); // Get user and loading state from context
  const [isVerifying, setIsVerifying] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Wait for the auth context to finish loading
    if (isLoading) {
      return;
    }
    
    // Check if the user is authenticated and has the SuperAdmin role
    if (user?.role !== 'SuperAdmin') {
      // If not, redirect to the main dashboard or login page
      toast({ title: "Access Denied", description: "You do not have permission to access the admin panel.", variant: "destructive" });
      router.push('/dashboard');
    } else {
      setIsVerifying(false);
    }
    // The regular admin login page is no longer needed with unified login
    // so we don't need a special check for it.

  }, [user, isLoading, router, toast]);


  // Show a loading spinner while verifying the role
  if (isVerifying || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Logo className="h-10 w-10 text-sidebar-primary flex-shrink-0" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                HR Streamline
              </h1>
              <span className="text-xs text-primary">Admin Panel</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <AdminSidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center">
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={logout} variant="outline">Logout</Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden animated-background-gradient">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
