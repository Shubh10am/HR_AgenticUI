'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Activity, AlertTriangle, Coins, Cpu, RefreshCw, UserPlus } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PlatformMetrics } from '@/services/admin/platform-metrics';
import KpiCard, { formatCompact } from '../components/kpi-card';
import { useAdminData } from '../components/use-admin-data';

const PERIODS = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const chartConfig = {
  actions: { label: 'User actions', color: 'hsl(var(--chart-1))' },
  failures: { label: 'Failed actions', color: 'hsl(var(--chart-5))' },
  aiRequests: { label: 'AI requests', color: 'hsl(var(--chart-2))' },
  signups: { label: 'New users', color: 'hsl(var(--chart-1))' },
  requests: { label: 'Requests', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const dayLabel = (value: string) => format(new Date(value), 'd MMM');

function ChartCard({ title, description, children, className }: { title: string; description: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-72">{children}</CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState('7');
  const { data, error, isLoading, reload } = useAdminData<PlatformMetrics>(`/api/admin/analytics?days=${period}`);
  const kpis = data?.kpis;
  const failureRate = kpis && kpis.actions.value ? `${((kpis.failedActions.value / kpis.actions.value) * 100).toFixed(1)}% of actions` : undefined;
  const chartNote = period === 'all' ? ' Charts show the last 90 days.' : '';

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Analytics" description="Usage, AI consumption and growth across every organization.">
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger id="admin-analytics-period" className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>{PERIODS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button id="admin-analytics-refresh" variant="outline" size="icon" onClick={reload} disabled={isLoading} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </PageHeader>

      {error && <Card className="border-destructive/40 p-4 text-sm text-destructive">{error}</Card>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard id="admin-analytics-ai-requests" title="AI requests" icon={Cpu} value={kpis?.aiRequests.value ?? null} previous={kpis?.aiRequests.previous} />
        <KpiCard id="admin-analytics-ai-tokens" title="AI tokens" icon={Coins} value={kpis ? formatCompact(kpis.aiTokens.value) : null} hint={kpis ? `${kpis.aiTokens.value.toLocaleString()} total` : undefined} />
        <KpiCard id="admin-analytics-actions" title="User actions" icon={Activity} value={kpis?.actions.value ?? null} previous={kpis?.actions.previous} />
        <KpiCard id="admin-analytics-failures" title="Failed actions" icon={AlertTriangle} value={kpis?.failedActions.value ?? null} previous={kpis?.failedActions.previous} invertTrend hint={failureRate} />
        <KpiCard id="admin-analytics-new-users" title="New users" icon={UserPlus} value={kpis?.newUsers.value ?? null} previous={kpis?.newUsers.previous} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Activity over time" description={`User actions, failures and AI requests per day.${chartNote}`}>
          {data ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={data.activityOverTime} margin={{ left: -16, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={dayLabel} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => format(new Date(value), 'd MMM yyyy')} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area dataKey="actions" type="monotone" stroke="var(--color-actions)" fill="var(--color-actions)" fillOpacity={0.2} />
                <Area dataKey="aiRequests" type="monotone" stroke="var(--color-aiRequests)" fill="var(--color-aiRequests)" fillOpacity={0.2} />
                <Area dataKey="failures" type="monotone" stroke="var(--color-failures)" fill="var(--color-failures)" fillOpacity={0.3} />
              </AreaChart>
            </ChartContainer>
          ) : <Skeleton className="h-full w-full" />}
        </ChartCard>

        <ChartCard title="New users" description={`Users added to organizations per day.${chartNote}`}>
          {data ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={data.signupsOverTime} margin={{ left: -16, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={dayLabel} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => format(new Date(value), 'd MMM yyyy')} />} />
                <Line dataKey="signups" type="monotone" stroke="var(--color-signups)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          ) : <Skeleton className="h-full w-full" />}
        </ChartCard>

        <ChartCard title="AI feature usage" description="Requests per AI feature in the selected period.">
          {!data ? <Skeleton className="h-full w-full" /> : data.featureUsage.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No AI requests in this period.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart layout="vertical" data={data.featureUsage} margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={150} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="requests" fill="var(--color-requests)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top organizations by AI usage</CardTitle>
            <CardDescription>Highest token consumers in the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            {!data ? <Skeleton className="h-48 w-full" /> : data.topOrganizations.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No AI usage in this period.</p>
            ) : (
              <Table scroll>
                <TableHeader>
                  <TableRow>
                    <TableHead id="admin-analytics-top-org-header">Organization</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topOrganizations.map((org) => (
                    <TableRow key={org.id} id={`admin-analytics-top-org-${org.id}-row`}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="text-right">{org.requests.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCompact(org.tokens)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
