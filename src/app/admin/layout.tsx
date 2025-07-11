
'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebarNav from './components/admin-sidebar-nav';
import Logo from '@/components/icons/logo';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Only run this check on the client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminAuthToken');
      
      // If there's no token and we're not on the login page, redirect
      if (!token && pathname !== '/admin/login') {
        router.push('/admin/login');
      } else {
        setIsVerifying(false);
      }
    }
  }, [pathname, router]);

  // If it's the login page, render it without the main layout shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show a loading spinner while verifying the token to prevent content flashing
  if (isVerifying) {
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
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Logo className="h-10 w-10 text-sidebar-primary" />
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                HR Streamline
              </h1>
              <span className="text-xs text-primary group-data-[collapsible=icon]:hidden">Admin Panel</span>
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
            {/* The regular UserNav might not be appropriate here. 
                Could be an Admin-specific UserNav in the future. */}
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
