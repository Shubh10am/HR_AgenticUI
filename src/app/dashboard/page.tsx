'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import AskCopilot from './components/ask-copilot';
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  FileText,
  MessageSquare,
  CalendarDays,
  GitFork,
  Plug,
  Library,
  LifeBuoy,
  DollarSign,
  ClipboardList,
  Sparkles,
  Inbox,
  CalendarClock,
  Briefcase,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tint: string;
}

interface Metric {
  id: string;
  label: string;
  value: number;
  hint: string;
  href: string;
  icon: LucideIcon;
  tint: string;
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded';
}

const metrics: Metric[] = [
  { id: 'recruitment', label: 'Active recruitment campaigns', value: 3, hint: 'Recruitment Hub', href: '/recruitment', icon: Briefcase, tint: 'from-indigo-500 to-violet-500' },
  { id: 'leave', label: 'Pending leave approvals', value: 5, hint: 'Attendance', href: '/attendance-management', icon: CalendarClock, tint: 'from-amber-500 to-orange-500' },
  { id: 'emails', label: 'Emails awaiting response', value: 12, hint: 'Gmail Inbox', href: '/gmail-inbox', icon: Inbox, tint: 'from-sky-500 to-cyan-500' },
  { id: 'tasks', label: 'Open tasks this week', value: 8, hint: 'Task board', href: '/tasks', icon: ClipboardList, tint: 'from-emerald-500 to-teal-500' },
];

const quickActions: QuickAction[] = [
  { id: 'email-assistance', title: 'Email Assistance', description: 'AI-powered help for inquiries', href: '/email-assistance', icon: Mail, tint: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  { id: 'recruitment', title: 'Recruitment Hub', description: 'Streamline hiring with AI', href: '/recruitment', icon: GitFork, tint: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  { id: 'smart-drafting', title: 'Smart Drafting', description: 'Generate emails from prompts', href: '/smart-drafting', icon: FileText, tint: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  { id: 'communications', title: 'Unified Comms', description: 'Aggregated communication logs', href: '/unified-communications', icon: MessageSquare, tint: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  { id: 'attendance', title: 'Attendance', description: 'Clock in/out and view reports', href: '/attendance-reporting', icon: CalendarDays, tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { id: 'payroll', title: 'Payroll', description: 'Run payroll and compensation', href: '/payroll', icon: DollarSign, tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { id: 'tasks', title: 'Tasks', description: 'Organize and track team tasks', href: '/tasks', icon: ClipboardList, tint: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  { id: 'knowledge-base', title: 'Knowledge Base', description: 'Manage documents and sources', href: '/knowledge-base', icon: Library, tint: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  { id: 'integrations', title: 'Integrations', description: 'Connect to other services', href: '/integrations', icon: Plug, tint: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  { id: 'support', title: 'Get Support', description: 'Raise a ticket for assistance', href: '/support', icon: LifeBuoy, tint: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
];

const services: ServiceStatus[] = [
  { id: 'email', name: 'Email Integration', status: 'operational' },
  { id: 'slack', name: 'Slack Integration', status: 'operational' },
  { id: 'ai', name: 'AI Services', status: 'operational' },
  { id: 'database', name: 'Database Connectivity', status: 'degraded' },
];

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const { greeting, today } = useMemo(() => {
    const now = new Date();
    return {
      greeting: greetingFor(now.getHours()),
      today: now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  }, []);

  const operationalCount = services.filter((s) => s.status === 'operational').length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary via-indigo-600 to-accent p-6 text-white shadow-xl shadow-primary/20 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{today}</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {greeting}, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-white/80">
              Here&apos;s what needs your attention across HR Streamline AI today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-white text-primary shadow-lg hover:bg-white/90" id="dashboard-hero-draft">
              <Link href="/smart-drafting">
                <Sparkles className="h-4 w-4" />
                Draft with AI
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" id="dashboard-hero-inbox">
              <Link href="/gmail-inbox">
                <Inbox className="h-4 w-4" />
                Open inbox
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <AskCopilot />

      {/* KPI tiles */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link key={metric.id} href={metric.href} id={`dashboard-metric-${metric.id}`} className="group">
            <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <div className="flex items-start justify-between">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', metric.tint)}>
                  <metric.icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <p className="mt-4 font-display text-3xl font-bold tracking-tight">{metric.value}</p>
              <p className="mt-1 text-sm font-medium text-foreground/80">{metric.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">via {metric.hint}</p>
            </Card>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick actions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quick actions</CardTitle>
            <CardDescription>Jump straight into your most-used tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  id={`dashboard-action-${action.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-secondary/60"
                >
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', action.tint)}>
                    <action.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{action.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{action.description}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {/* System status */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  System status
                </CardTitle>
                <Badge variant="outline" className="rounded-full font-medium">
                  {operationalCount}/{services.length} up
                </Badge>
              </div>
              <CardDescription>Current status of integrated services.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border/70">
                {services.map((service) => (
                  <li key={service.id} id={`dashboard-status-${service.id}`} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        {service.status === 'degraded' && (
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-60" />
                        )}
                        <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', service.status === 'operational' ? 'bg-success' : 'bg-warning')} />
                      </span>
                      {service.name}
                    </span>
                    {service.status === 'operational' ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Operational
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-warning">
                        <AlertTriangle className="h-3.5 w-3.5" /> Degraded
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Knowledge base promo */}
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10">
            <CardContent className="p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                <Sparkles className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">Need a hand?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search policies, draft replies, or get answers from your knowledge base.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4" id="dashboard-kb-link">
                <Link href="/knowledge-base">
                  Open Knowledge Base
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
