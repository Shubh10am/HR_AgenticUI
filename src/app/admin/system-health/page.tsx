'use client';

import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle2, CircleSlash, RefreshCw, ScrollText, XCircle } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CheckStatus, SystemHealth } from '@/services/admin/system-health';
import { cn } from '@/lib/utils';
import { useAdminData } from '../components/use-admin-data';

const STATUS: Record<CheckStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  operational: { label: 'Operational', icon: CheckCircle2, className: 'text-emerald-600 dark:text-emerald-400' },
  degraded: { label: 'Degraded', icon: AlertTriangle, className: 'text-amber-600 dark:text-amber-400' },
  down: { label: 'Down', icon: XCircle, className: 'text-red-600 dark:text-red-400' },
  not_configured: { label: 'Not configured', icon: CircleSlash, className: 'text-muted-foreground' },
};

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function AdminSystemHealthPage() {
  const { data, error, isLoading, reload } = useAdminData<SystemHealth>('/api/admin/system-health');
  const worst = data?.checks.some((check) => check.status === 'down') ? 'down' : data?.checks.some((check) => check.status === 'degraded') ? 'degraded' : 'operational';

  return (
    <div className="space-y-6">
      <PageHeader title="System Health" description="Live checks of the services the platform depends on.">
        <Button id="admin-health-refresh" variant="outline" size="sm" onClick={reload} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Re-run checks
        </Button>
      </PageHeader>

      {error && <Card className="border-destructive/40 p-4 text-sm text-destructive">{error}</Card>}

      {data && (
        <Card className={cn('flex flex-wrap items-center justify-between gap-3 p-5', worst === 'operational' ? 'border-emerald-500/40 bg-emerald-500/5' : worst === 'degraded' ? 'border-amber-500/40 bg-amber-500/5' : 'border-red-500/40 bg-red-500/5')}>
          <p className="font-semibold">{worst === 'operational' ? 'All core systems operational' : worst === 'degraded' ? 'Some systems are degraded' : 'A core system is down'}</p>
          <p className="text-sm text-muted-foreground">Checked {format(new Date(data.checkedAt), 'HH:mm:ss')} · server up {formatUptime(data.uptimeSeconds)} · Node {data.nodeVersion}</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {!data ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-24" />) : data.checks.map((check) => {
          const status = STATUS[check.status];
          return (
            <Card key={check.id} id={`admin-health-${check.id}`} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{check.name}</p>
                <span className={cn('inline-flex shrink-0 items-center gap-1 text-sm font-medium', status.className)}><status.icon className="h-4 w-4" />{status.label}</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{check.detail}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Request activity</CardTitle><CardDescription>Recorded user actions.</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {!data ? <Skeleton className="h-24 w-full" /> : ([['Last hour', data.activity.lastHour], ['Last 24 hours', data.activity.lastDay]] as const).map(([label, stats]) => (
              <div key={label}>
                <p className="text-muted-foreground">{label}</p>
                <p className="mt-0.5"><span className="font-semibold">{stats.total}</span> actions · <span className={stats.failures ? 'font-semibold text-red-600 dark:text-red-400' : ''}>{stats.failures} failed</span>{stats.avgMs !== null && ` · ${stats.avgMs} ms average`}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div><CardTitle className="text-base">Recent failures</CardTitle><CardDescription>Failed actions in the last 24 hours.</CardDescription></div>
            <Button asChild size="sm" variant="outline"><Link id="admin-health-open-logs" href="/admin/logs?outcome=failure"><ScrollText className="mr-2 h-4 w-4" />Open in Logs</Link></Button>
          </CardHeader>
          <CardContent>
            {!data ? <Skeleton className="h-32 w-full" /> : data.recentFailures.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No failures in the last 24 hours.</p>
            ) : (
              <ul className="divide-y text-sm">
                {data.recentFailures.map((failure) => (
                  <li key={failure.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate"><span className="mr-2 font-mono font-semibold text-red-600 dark:text-red-400">{failure.statusCode}</span>{failure.action}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{failure.method} {failure.path} · {failure.actorName}</p>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(new Date(failure.createdAt), { addSuffix: true })}</time>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
