
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
  UserPlus,
  Network, // Changed from Sitemap to Network
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar'; 
import { useAuth } from '@/contexts/auth-context';

interface NavItem {
  id: string; // Unique ID for the tour
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
  adminOnly?: boolean;
  section: NavSection;
}

type NavSection = 'Overview' | 'Communication' | 'People' | 'Workspace';
const sections: NavSection[] = ['Overview', 'Communication', 'People', 'Workspace'];

const navItems: NavItem[] = [
  { section: 'Overview', id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
  { section: 'Overview', id: 'community', href: '/community', label: 'Community', icon: MessageCircle, tooltip: 'Community Hub' },
  { section: 'Communication', id: 'email-assistance', href: '/email-assistance', label: 'Email Assistance', icon: MailPlus, tooltip: 'Email Assistance' },
  { section: 'Communication', id: 'gmail-inbox', href: '/gmail-inbox', label: 'Gmail Inbox', icon: Inbox, tooltip: 'Gmail Inbox' },
  { section: 'People', id: 'my-attendance', href: '/attendance-reporting', label: 'My Attendance', icon: CalendarCheck, tooltip: 'My Attendance & Reporting' },
  { section: 'People', id: 'payroll', href: '/payroll', label: 'Payroll', icon: DollarSign, tooltip: 'Payroll Management' },
  { section: 'Overview', id: 'tasks', href: '/tasks', label: 'Tasks', icon: ClipboardList, tooltip: 'Task Management Board' },
  { section: 'Communication', id: 'communications', href: '/unified-communications', label: 'Communications', icon: MessagesSquare, tooltip: 'Unified Communications' },
  { section: 'People', id: 'recruitment', href: '/recruitment', label: 'Recruitment', icon: GitFork, tooltip: 'AI Recruitment' },
  { section: 'Communication', id: 'smart-drafting', href: '/smart-drafting', label: 'Smart Drafting', icon: FileSignature, tooltip: 'Smart Email Drafting' },
  { section: 'People', id: 'onboarding', href: '/employee-onboarding', label: 'Onboarding', icon: UserPlus, tooltip: 'Employee Onboarding', adminOnly: true },
  { section: 'Workspace', id: 'knowledge-base', href: '/knowledge-base', label: 'Knowledge Base', icon: Library, tooltip: 'Knowledge Base' },
  { section: 'People', id: 'manage-employees', href: '/manage-employees', label: 'Manage Employees', icon: Users, tooltip: 'Manage Employees', adminOnly: true },
  { section: 'People', id: 'employee-hierarchy', href: '/employee-hierarchy', label: 'Hierarchy', icon: Network, tooltip: 'Employee Hierarchy' },
  { section: 'People', id: 'attendance-mgmt', href: '/attendance-management', label: 'Attendance Mgmt', icon: ClipboardList, tooltip: 'Attendance Management', adminOnly: true },
  { section: 'Workspace', id: 'integrations', href: '/integrations', label: 'Integrations', icon: Plug, tooltip: 'Manage Integrations' },
  { section: 'Workspace', id: 'support', href: '/support', label: 'Get Support', icon: LifeBuoy, tooltip: 'Get Support' },
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

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <>
      {sections.map((section) => {
        const items = filteredNavItems.filter((item) => item.section === section);
        if (items.length === 0) return null;
        return (
          <SidebarGroup key={section} className="min-w-0 py-1 group-data-[collapsible=icon]:py-0.5">
            <SidebarGroupLabel className="px-3 group-data-[collapsible=icon]:hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref legacyBehavior>
                      <a onClick={handleLinkClick} className="flex w-full justify-center" data-tour-id={item.id} id={`nav-${item.id}`}>
                        <SidebarMenuButton
                          isActive={isActive(item.href)}
                          tooltip={item.tooltip}
                          className="h-9 justify-start rounded-lg px-3 font-medium text-sidebar-foreground transition-colors data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>svg]:size-[18px]"
                        >
                          <item.icon className="h-[18px] w-[18px]" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </SidebarMenuButton>
                      </a>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
