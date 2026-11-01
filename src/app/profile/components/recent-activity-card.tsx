'use client';

import Link from 'next/link';
import { Activity, AlertTriangle, ArrowRight, MonitorSmartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { describeDevice } from '@/app/audit-log/device';
import type { ProfileOverview } from '@/services/profile/overview';
import { formatDateTime, formatRelative, type DisplayPrefs } from '../format';

interface Props {
  overview: ProfileOverview | null;
  isLoading: boolean;
  prefs: DisplayPrefs;
  showNewDeviceAlerts: boolean;
}

export default function RecentActivityCard({ overview, isLoading, prefs, showNewDeviceAlerts }: Props) {
  const stats = overview?.stats;
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-primary" /> Recent Activity
          </CardTitle>
          <CardDescription>Your latest actions, with the device and IP address they came from.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" id="profile-activity-view-all">
          <Link href="/audit-log">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Actions', value: stats.actions },
              { label: 'Sign-ins', value: stats.signIns },
              { label: 'Failed sign-ins', value: stats.failedSignIns, warn: stats.failedSignIns > 0 },
              { label: 'Devices', value: stats.devices },
            ].map((tile) => (
              <div key={tile.label} className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className={`text-2xl font-bold ${tile.warn ? 'text-destructive' : 'text-primary'}`}>{tile.value}</p>
                <p className="text-xs text-muted-foreground">{tile.label} · {stats.windowDays}d</p>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : !overview || overview.recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No activity recorded yet. Changes you make will appear here.</p>
        ) : (
          <ul id="profile-activity-list" className="max-h-80 divide-y overflow-y-auto rounded-lg border px-3">
            {overview.recent.map((item) => (
              <li key={item.id} id={`profile-activity-${item.id}`} className="flex flex-col gap-1 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {item.outcome === 'failure' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    {item.action}
                    {item.outcome === 'failure' && <Badge variant="destructive">Failed</Badge>}
                    {showNewDeviceAlerts && item.isNewDevice && <Badge variant="outline" className="border-amber-500 text-amber-600">New device</Badge>}
                  </div>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MonitorSmartphone className="h-3 w-3 shrink-0" />
                    {describeDevice(item.userAgent)} · IP {item.ipAddress || 'unknown'} · {item.category}
                  </p>
                </div>
                <time dateTime={item.createdAt} title={formatDateTime(item.createdAt, prefs)} className="shrink-0 text-xs text-muted-foreground">
                  {formatRelative(item.createdAt, prefs)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
