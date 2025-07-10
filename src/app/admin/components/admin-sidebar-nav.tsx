
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, Users, BarChart2, Settings, Shield, Briefcase, FileText, Server } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Admin Dashboard' },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2, tooltip: 'View Analytics' },
  { href: '/admin/users', label: 'User Management', icon: Users, tooltip: 'Manage Users' },
  { href: '/admin/organizations', label: 'Organizations', icon: Briefcase, tooltip: 'Manage Organizations' },
  { href: '/admin/content-management', label: 'Content', icon: FileText, tooltip: 'Content Management' },
  { href: '/admin/system-health', label: 'System Health', icon: Server, tooltip: 'System Health & Logs' },
  { href: '/admin/settings', label: 'System Settings', icon: Settings, tooltip: 'System Settings' },
  { href: '/dashboard', label: 'Back to App', icon: Shield, tooltip: 'Go to Main App' },
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
            <a onClick={handleLinkClick} className="block w-full">
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
