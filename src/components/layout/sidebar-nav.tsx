
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
  Users,
  Library,
  LifeBuoy,
  MessageCircle,
  DollarSign,
  ClipboardList,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar'; 
import { useAuth } from '@/contexts/auth-context';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
  { href: '/community', label: 'Community', icon: MessageCircle, tooltip: 'Community Hub' },
  { href: '/email-assistance', label: 'Email Assistance', icon: MailPlus, tooltip: 'Email Assistance' },
  { href: '/gmail-inbox', label: 'Gmail Inbox', icon: Inbox, tooltip: 'Gmail Inbox' },
  { href: '/attendance-reporting', label: 'My Attendance', icon: CalendarCheck, tooltip: 'My Attendance & Reporting' },
  { href: '/payroll', label: 'Payroll', icon: DollarSign, tooltip: 'Payroll Management' },
  { href: '/tasks', label: 'Tasks', icon: ClipboardList, tooltip: 'Task Management Board' },
  { href: '/unified-communications', label: 'Communications', icon: MessagesSquare, tooltip: 'Unified Communications' },
  { href: '/recruitment', label: 'Recruitment', icon: GitFork, tooltip: 'AI Recruitment' },
  { href: '/smart-drafting', label: 'Smart Drafting', icon: FileSignature, tooltip: 'Smart Email Drafting' },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: Library, tooltip: 'Knowledge Base' },
  { href: '/manage-employees', label: 'Manage Employees', icon: Users, tooltip: 'Manage Employees', adminOnly: true },
  { href: '/attendance-management', label: 'Attendance Mgmt', icon: ClipboardList, tooltip: 'Attendance Management', adminOnly: true },
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
      // Show adminOnly items if user role is Admin or HR
      return user?.role === 'Admin' || user?.role === 'HR';
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
