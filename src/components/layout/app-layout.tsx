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
import { Loader2, MessageSquare } from 'lucide-react'; // Added MessageSquare
import CopilotSidebar from './copilot-sidebar'; // Added import
import { useState } from 'react'; // Added import for useState
import { Button } from '@/components/ui/button'; // Added Button import

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false); // Added state for copilot

  // Define routes that don't use this AppLayout (e.g., login, register)
  const noAppLayoutRoutes = ['/login', '/register'];

  if (noAppLayoutRoutes.includes(pathname)) {
    return <>{children}</>; // Render children directly for auth pages
  }
  
  if (isLoading && !noAppLayoutRoutes.includes(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
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
            <SidebarTrigger />
            {/* Breadcrumbs or page title could go here */}
          </div>
          <div className="flex items-center gap-2"> {/* Wrapper for UserNav and Copilot trigger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCopilotOpen(true)}
              aria-label="Open Copilot Chat"
              title="Open Copilot Chat"
              className="h-9 w-9"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden animated-background-gradient">
          {children}
        </main>
        <CopilotSidebar isOpen={isCopilotOpen} onOpenChange={setIsCopilotOpen} /> {/* Added CopilotSidebar */}
      </SidebarInset>
    </SidebarProvider>
  );
}
