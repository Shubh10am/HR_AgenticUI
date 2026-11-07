'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, LayoutDashboard, MessageCircle, MessageSquare, Palmtree } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/leave', label: 'Leave', icon: Palmtree },
  { href: '/approvals', label: 'Approvals', icon: CheckSquare },
  { href: '/community', label: 'Community', icon: MessageCircle },
];

/** Thumb-friendly navigation on phones; the full sidebar stays available from the menu button. */
export default function MobileTabBar({ onCopilot }: { onCopilot: () => void }) {
  const pathname = usePathname() ?? '';
  return (
    <nav id="mobile-tab-bar" aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link id={`mobile-tab-${label.toLowerCase()}`} href={href} className={cn('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', active ? 'text-primary' : 'text-muted-foreground')} aria-current={active ? 'page' : undefined}>
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button id="mobile-tab-copilot" type="button" onClick={onCopilot} className="flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground">
            <MessageSquare className="h-5 w-5" />
            Copilot
          </button>
        </li>
      </ul>
    </nav>
  );
}
