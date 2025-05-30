
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
  Plug,
  GitFork,
  Inbox,
  FileSignature,
  ListChecks, // Added ListChecks icon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar'; // Import useSidebar

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
  { href: '/email-assistance', label: 'Email Assistance', icon: MailPlus, tooltip: 'Email Assistance' },
  { href: '/gmail-inbox', label: 'Gmail Inbox', icon: Inbox, tooltip: 'Gmail Inbox' },
  { href: '/attendance-reporting', label: 'Attendance', icon: CalendarCheck, tooltip: 'Attendance & Reporting' },
  { href: '/unified-communications', label: 'Communications', icon: MessagesSquare, tooltip: 'Unified Communications' },
  { href: '/recruitment', label: 'Recruitment', icon: GitFork, tooltip: 'AI Recruitment' },
  { href: '/smart-drafting', label: 'Smart Drafting', icon: FileSignature, tooltip: 'Smart Email Drafting' },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, tooltip: 'Task Management' }, // New Tasks link
  { href: '/integrations', label: 'Integrations', icon: Plug, tooltip: 'Manage Integrations' },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar(); // Get sidebar context

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false); // Close sidebar on mobile after click
    }
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <a onClick={handleLinkClick} className="block w-full"> {/* Added <a> tag and onClick */}
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
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
