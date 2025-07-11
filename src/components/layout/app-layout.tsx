
'use client';

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
import { Loader2, MessageSquare } from 'lucide-react';
import CopilotSidebar from './copilot-sidebar';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AccountStatusOverlay from '@/components/account-status-overlay'; // Import the new overlay

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const publicPages = ['/login', '/register', '/', '/contact', '/book-a-demo'];
  const isAdminPage = pathname.startsWith('/admin');
  const isLegalPage = pathname.startsWith('/legal');
  const isBlogPage = pathname.startsWith('/blog');
  const isDocsPage = pathname.startsWith('/docs');
  const isPublicPage = publicPages.includes(pathname) || isLegalPage || isBlogPage || isDocsPage;

  if (isPublicPage || isAdminPage) {
    return <>{children}</>;
  }
  
  if (isLoading) {
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

  const logoHref = pathname === '/dashboard' ? '/' : '/dashboard';

  const orgStatus = user?.organizationStatus;

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href={logoHref} className="flex items-center gap-2">
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
        {(orgStatus === 'Hold' || orgStatus === 'Suspended') && (
          <AccountStatusOverlay status={orgStatus} />
        )}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center">
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-2">
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
          <div className="animate-fade-in" key={pathname}>
            {children}
          </div>
        </main>
        <CopilotSidebar isOpen={isCopilotOpen} onOpenChange={setIsCopilotOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
}
