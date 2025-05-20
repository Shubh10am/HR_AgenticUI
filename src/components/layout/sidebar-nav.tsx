
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  MailPlus,
  CalendarCheck,
  MessagesSquare,
  Users,
  FileSignature,
  Briefcase,
  Plug, // New icon for Integrations
  GitFork, // Using GitFork for Recruitment as Briefcase is used elsewhere.
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
  { href: '/email-assistance', label: 'Email Assistance', icon: MailPlus, tooltip: 'Email Assistance' },
  { href: '/attendance-reporting', label: 'Attendance', icon: CalendarCheck, tooltip: 'Attendance & Reporting' },
  { href: '/unified-communications', label: 'Communications', icon: MessagesSquare, tooltip: 'Unified Communications' },
  { href: '/recruitment', label: 'Recruitment', icon: GitFork, tooltip: 'AI Recruitment' },
  { href: '/smart-drafting', label: 'Smart Drafting', icon: FileSignature, tooltip: 'Smart Email Drafting' },
  { href: '/integrations', label: 'Integrations', icon: Plug, tooltip: 'Manage Integrations' },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
              tooltip={item.tooltip}
              className="justify-start group-data-[collapsible=icon]:justify-center"
            >
              <item.icon className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

    