
'use client';

import MaintenanceGate from './maintenance-gate';
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
import { Loader2, MessageSquare, Sparkles } from 'lucide-react';
import CopilotSidebar from './copilot-sidebar'; // Adjusted path if needed
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AccountStatusOverlay from '@/components/account-status-overlay';
import AppTour from '@/components/app-tour';
import { ShepherdTour, ShepherdTourContext } from 'react-shepherd';
import { useRouter } from 'next/navigation';


export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const router = useRouter();

  // This effect handles redirecting unauthenticated users from protected pages.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const logoHref = pathname === '/dashboard' ? '/' : '/dashboard';
  const orgStatus = user?.organizationStatus;
  const pageTitle = (pathname ?? '')
    .split('/')
    .filter(Boolean)[0]
    ?.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') ?? 'Dashboard';

  return (
    <ShepherdTour steps={[]} tourOptions={{ useModalOverlay: true }}>
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border px-3 py-4 group-data-[collapsible=icon]:px-0">
          <Link href={logoHref} className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center" id="sidebar-logo-link">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/30">
              <Logo className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
              <span className="font-display text-[15px] font-bold text-foreground">HR Streamline</span>
              <span className="text-[11px] font-medium text-muted-foreground">Agentic HR workspace</span>
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="mt-auto p-3 group-data-[collapsible=icon]:hidden">
          <button
            type="button"
            id="sidebar-copilot-cta"
            onClick={() => setIsCopilotOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-primary/15 bg-gradient-to-br from-primary/10 to-accent/10 p-3 text-left transition-colors hover:from-primary/15 hover:to-accent/15"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">Ask Copilot</span>
              <span className="text-xs text-muted-foreground">Your AI HR assistant</span>
            </span>
          </button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 overflow-x-hidden">
        {(orgStatus === 'Hold' || orgStatus === 'Suspended') && (
          <AccountStatusOverlay status={orgStatus} />
        )}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:block">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsCopilotOpen(true)}
              aria-label="Open Copilot Chat"
              title="Open Copilot Chat"
              className="h-9 gap-2 rounded-full px-3 text-muted-foreground hover:text-foreground"
              id="copilot-btn"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden text-sm sm:inline">Copilot</span>
            </Button>
            <UserNav />
          </div>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 animated-background-gradient">
          <div className="mx-auto min-h-0 min-w-0 max-w-[1440px] animate-fade-in" key={pathname}>
            <MaintenanceGate>{children}</MaintenanceGate>
          </div>
        </main>
        <CopilotSidebar isOpen={isCopilotOpen} onOpenChange={setIsCopilotOpen} />
      </SidebarInset>
      <AppTour />
    </SidebarProvider>
    </ShepherdTour>
  );
}
