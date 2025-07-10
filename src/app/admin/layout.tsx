
'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebarNav from './components/admin-sidebar-nav';
import UserNav from '@/components/layout/user-nav'; 
import Logo from '@/components/icons/logo';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Temporarily commented out for development purposes
  // if (!user || user.role !== 'Admin') {
  //   router.replace('/dashboard');
  //   return (
  //      <div className="flex min-h-screen items-center justify-center bg-background">
  //       <Loader2 className="h-16 w-16 animate-spin text-primary" />
  //       <p className="ml-4">Redirecting...</p>
  //     </div>
  //   );
  // }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-sidebar-primary" />
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
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center">
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden animated-background-gradient">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
