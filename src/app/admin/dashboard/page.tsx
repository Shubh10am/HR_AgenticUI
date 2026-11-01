'use client';

import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Activity, AlertTriangle, ArrowRight, Briefcase, Cpu, Handshake, LifeBuoy, RefreshCw, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlatformMetrics } from '@/services/admin/platform-metrics';
import KpiCard, { formatCompact } from '../components/kpi-card';
import { useAdminData } from '../components/use-admin-data';

const chartConfig = {
  actions: { label: 'User actions', color: 'hsl(var(--chart-1))' },
  aiRequests: { label: 'AI requests', color: 'hsl(var(--chart-2))' },
  signups: { label: 'New users', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-500',
  Hold: 'bg-amber-500',
  Suspended: 'bg-red-500',
};

export default function AdminDashboardPage() {
  const { data, error, isLoading, reload } = useAdminData<PlatformMetrics>('/api/admin/analytics?days=30');
  const kpis = data?.kpis;
  const orgTotal = data?.organizationStatus.reduce((sum, row) => sum + row.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Live overview of the platform for the last 30 days.">
        <Button id="admin-dashboard-refresh" variant="outline" size="sm" onClick={reload} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </PageHeader>

      {error && <Card className="border-destructive/40 p-4 text-sm text-destructive">{error}</Card>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard id="admin-kpi-organizations" title="Organizations" icon={Briefcase} value={kpis?.organizations.value ?? null} previous={kpis?.organizations.previous} href="/admin/organizations" hint={kpis ? `· ${kpis.activeOrganizations} active` : undefined} />
        <KpiCard id="admin-kpi-users" title="Total users" icon={Users} value={kpis?.users.value ?? null} previous={kpis?.users.previous} href="/admin/organizations" />
        <KpiCard id="admin-kpi-open-tickets" title="Open support tickets" icon={LifeBuoy} value={kpis?.openTickets ?? null} href="/admin/support-tickets" hint="Open or in progress" />
        <KpiCard id="admin-kpi-inquiries" title="New inquiries" icon={Handshake} value={kpis?.newInquiries.value ?? null} previous={kpis?.newInquiries.previous} href="/admin/customer-inquiries" />
        <KpiCard id="admin-kpi-ai-requests" title="AI requests" icon={Cpu} value={kpis?.aiRequests.value ?? null} previous={kpis?.aiRequests.previous} href="/admin/analytics" hint={kpis ? `· ${formatCompact(kpis.aiTokens.value)} tokens` : undefined} />
        <KpiCard id="admin-kpi-actions" title="User actions" icon={Activity} value={kpis?.actions.value ?? null} previous={kpis?.actions.previous} href="/admin/logs" />
        <KpiCard id="admin-kpi-failures" title="Failed actions" icon={AlertTriangle} value={kpis?.failedActions.value ?? null} previous={kpis?.failedActions.previous} invertTrend href="/admin/logs?outcome=failure" />
        <KpiCard id="admin-kpi-new-users" title="New users" icon={Users} value={kpis?.newUsers.value ?? null} previous={kpis?.newUsers.previous} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Platform activity</CardTitle>
            <CardDescription>User actions and AI requests per day.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {data ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={data.activityOverTime} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={(value) => format(new Date(value), 'd MMM')} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => format(new Date(value), 'd MMM yyyy')} />} />
                  <Area dataKey="actions" type="monotone" stroke="var(--color-actions)" fill="var(--color-actions)" fillOpacity={0.25} />
                  <Area dataKey="aiRequests" type="monotone" stroke="var(--color-aiRequests)" fill="var(--color-aiRequests)" fillOpacity={0.25} />
                </AreaChart>
              </ChartContainer>
            ) : <Skeleton className="h-full w-full" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization status</CardTitle>
            <CardDescription>{orgTotal} organizations on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data ? data.organizationStatus.map((row) => (
              <div key={row.status}>
                <div className="flex justify-between text-sm"><span>{row.status}</span><span className="font-medium">{row.count}</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-muted">
                  <div className={`h-2 rounded-full ${STATUS_STYLES[row.status] ?? 'bg-primary'}`} style={{ width: `${orgTotal ? (row.count / orgTotal) * 100 : 0}%` }} />
                </div>
              </div>
            )) : <Skeleton className="h-24 w-full" />}
            <Button asChild variant="link" className="h-auto px-0"><Link href="/admin/organizations">Manage organizations <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>Latest actions across all organizations.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm"><Link href="/admin/logs" id="admin-dashboard-view-logs">Open logs</Link></Button>
        </CardHeader>
        <CardContent>
          {!data ? <Skeleton className="h-40 w-full" /> : data.recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {data.recentActivity.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${entry.outcome === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div className="min-w-0">
                      <p className="truncate"><span className="font-medium">{entry.actorName || entry.actorEmail || 'Unknown user'}</span> · {entry.action}</p>
                      <p className="truncate text-xs text-muted-foreground">{entry.organization}</p>
                    </div>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground" title={format(new Date(entry.createdAt), 'd MMM yyyy, HH:mm:ss')}>
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
