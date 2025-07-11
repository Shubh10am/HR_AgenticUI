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
  ListChecks, 
  Users, // Added Users icon
  Library, // Added Library icon
  LifeBuoy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar'; 
import { useAuth } from '@/contexts/auth-context'; // Import useAuth

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
  { href: '/email-assistance', label: 'Email Assistance', icon: MailPlus, tooltip: 'Email Assistance' },
  { href: '/gmail-inbox', label: 'Gmail Inbox', icon: Inbox, tooltip: 'Gmail Inbox' },
  { href: '/attendance-reporting', label: 'Attendance', icon: CalendarCheck, tooltip: 'Attendance & Reporting' },
  { href: '/unified-communications', label: 'Communications', icon: MessagesSquare, tooltip: 'Unified Communications' },
  { href: '/recruitment', label: 'Recruitment', icon: GitFork, tooltip: 'AI Recruitment' },
  { href: '/smart-drafting', label: 'Smart Drafting', icon: FileSignature, tooltip: 'Smart Email Drafting' },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, tooltip: 'Task Management' },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: Library, tooltip: 'Knowledge Base' },
  { href: '/manage-employees', label: 'Manage Employees', icon: Users, tooltip: 'Manage Employees', adminOnly: true }, // New Manage Employees link
  { href: '/integrations', label: 'Integrations', icon: Plug, tooltip: 'Manage Integrations' },
  { href: '/support', label: 'Get Support', icon: LifeBuoy, tooltip: 'Get Support' },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { isMobile, setOpen } = useSidebar(); 
  const { user } = useAuth(); // Get user from AuthContext

  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false); 
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return user?.role === 'Admin';
    }
    return true;
  });

  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <a onClick={handleLinkClick} className="block w-full"> 
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
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
