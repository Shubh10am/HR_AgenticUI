
'use client';

import { type ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebarNav from './components/admin-sidebar-nav';
import UserNav from '@/components/layout/user-nav'; 
import Logo from '@/components/icons/logo';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
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
