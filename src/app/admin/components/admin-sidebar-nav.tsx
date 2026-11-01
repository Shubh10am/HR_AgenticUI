
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, Users, BarChart2, Settings, Shield, Briefcase, FileText, Server, LifeBuoy, MessageSquare, Handshake } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
}

const navItems: NavItem[] = [
  { id: 'admin-dashboard', href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Admin Dashboard' },
  { id: 'admin-analytics', href: '/admin/analytics', label: 'Analytics', icon: BarChart2, tooltip: 'View Analytics' },
  { id: 'admin-users', href: '/admin/users', label: 'User Management', icon: Users, tooltip: 'Manage Users' },
  { id: 'admin-organizations', href: '/admin/organizations', label: 'Organizations', icon: Briefcase, tooltip: 'Manage Organizations' },
  { id: 'admin-inquiries', href: '/admin/customer-inquiries', label: 'Customer Inquiries', icon: Handshake, tooltip: 'View Customer Inquiries' },
  { id: 'admin-community', href: '/admin/community-posts', label: 'Community Posts', icon: MessageSquare, tooltip: 'Manage Community Posts' },
  { id: 'admin-support', href: '/admin/support-tickets', label: 'Support', icon: LifeBuoy, tooltip: 'Support Tickets' },
  { id: 'admin-content', href: '/admin/content-management', label: 'Content', icon: FileText, tooltip: 'Content Management' },
  { id: 'admin-system-health', href: '/admin/system-health', label: 'System Health', icon: Server, tooltip: 'System Health & Logs' },
  { id: 'admin-settings', href: '/admin/settings', label: 'System Settings', icon: Settings, tooltip: 'System Settings' },
  { id: 'admin-back-to-app', href: '/dashboard', label: 'Back to App', icon: Shield, tooltip: 'Go to Main App' },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();
  const { isMobile, setOpen } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <a onClick={handleLinkClick} className="block w-full" data-tour-id={item.id}>
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))}
                tooltip={item.tooltip}
                className="justify-start group-data-[collapsible=icon]:justify-center"
              >
                <item.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </a>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
