'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pause, Play, RefreshCw, Route, Search, X } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminData } from '../components/use-admin-data';
import LogDetailSheet from './components/log-detail-sheet';
import LogFacets from './components/log-facets';
import LogHistogram from './components/log-histogram';
import LogStats from './components/log-stats';
import LogTable from './components/log-table';
import { EMPTY_FILTERS, RANGE_OPTIONS, type LogEntry, type LogFilters, type LogResult } from './types';

const PAGE_SIZE = 50;
const LIVE_INTERVAL_MS = 10_000;
const FILTER_LABELS: Partial<Record<keyof LogFilters, string>> = { q: 'Search', organizationId: 'Organization', actorId: 'User', category: 'Category', outcome: 'Result', method: 'Method', status: 'Status' };

function LogsExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the source of truth for filters, so a view can be bookmarked or shared.
  const filters = useMemo<LogFilters>(() => {
    const next = { ...EMPTY_FILTERS };
    (Object.keys(next) as (keyof LogFilters)[]).forEach((key) => { next[key] = searchParams?.get(key) ?? next[key]; });
    return next;
  }, [searchParams]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(filters.q);
  const [isLive, setIsLive] = useState(false);
  const [selected, setSelected] = useState<LogEntry | null>(null);

  const setFilter = useCallback((key: keyof LogFilters, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value && value !== EMPTY_FILTERS[key]) params.set(key, value); else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setPage(1);
  }, [pathname, router, searchParams]);

  const url = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    (Object.entries(filters) as [keyof LogFilters, string][]).forEach(([key, value]) => value && params.set(key, value));
    return `/api/admin/logs?${params.toString()}`;
  }, [filters, page]);

  const { data, error, isLoading, reload } = useAdminData<LogResult>(url);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(reload, LIVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isLive, reload]);

  useEffect(() => { setSearchTerm(filters.q); }, [filters.q]);

  const tracedUser = filters.actorId ? data?.facets.users.find((user) => user.id === filters.actorId) : undefined;
  const activeFilters = (Object.keys(FILTER_LABELS) as (keyof LogFilters)[]).filter((key) => filters[key]);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const labelFor = (key: keyof LogFilters) => {
    const value = filters[key];
    if (key === 'organizationId') return data?.facets.organizations.find((org) => org.id === value)?.name ?? value;
    if (key === 'actorId') return tracedUser?.name ?? value;
    return value;
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Logs" description="Search and trace every action taken across the platform: who, what, when and from where.">
        <div className="flex flex-wrap gap-2">
          <Select value={filters.range} onValueChange={(value) => setFilter('range', value)}>
            <SelectTrigger id="admin-logs-range" className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>{RANGE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button id="admin-logs-live" variant={isLive ? 'default' : 'outline'} size="sm" className="h-10" onClick={() => setIsLive((live) => !live)}>
            {isLive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{isLive ? 'Live' : 'Go live'}
          </Button>
          <Button id="admin-logs-refresh" variant="outline" size="icon" className="h-10 w-10" onClick={reload} disabled={isLoading} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </PageHeader>

      <form onSubmit={(event) => { event.preventDefault(); setFilter('q', searchTerm.trim()); }} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id="admin-logs-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by user, email, action, path or IP address, then press Enter" className="h-11 pl-9 font-mono text-sm" />
      </form>

      {(activeFilters.length > 0 || tracedUser) && (
        <div className="flex flex-wrap items-center gap-2">
          {tracedUser && (
            <Badge className="gap-1.5 py-1"><Route className="h-3.5 w-3.5" />Tracing {tracedUser.name}{tracedUser.email && ` (${tracedUser.email})`}</Badge>
          )}
          {activeFilters.filter((key) => key !== 'actorId' || !tracedUser).map((key) => (
            <Badge key={key} variant="secondary" className="gap-1 py-1 font-normal">
              {FILTER_LABELS[key]}: <span className="font-medium">{labelFor(key)}</span>
              <button type="button" id={`admin-logs-remove-${key}`} onClick={() => setFilter(key, '')} aria-label={`Remove ${FILTER_LABELS[key]} filter`} className="ml-0.5 rounded hover:bg-muted"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          <Button id="admin-logs-clear" variant="link" size="sm" className="h-auto px-1" onClick={() => router.replace(`${pathname}?range=${filters.range}`, { scroll: false })}>Clear all</Button>
        </div>
      )}

      {error && <Card className="border-destructive/40 p-4 text-sm text-destructive">{error}</Card>}

      {data ? <LogStats stats={data.stats} /> : <Skeleton className="h-[68px] w-full" />}

      <Card className="p-4">{data ? <LogHistogram histogram={data.histogram} bucket={data.bucket} /> : <Skeleton className="h-36 w-full" />}</Card>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit p-3 lg:sticky lg:top-20">
          <LogFacets facets={data?.facets} filters={filters} onChange={setFilter} />
        </Card>

        <Card className="min-w-0 overflow-hidden">
          {!data ? (
            <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-9 w-full" />)}</div>
          ) : data.entries.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No events match this search. Try a longer time range or fewer filters.</p>
          ) : (
            <LogTable entries={data.entries} onSelect={setSelected} />
          )}
          {data && data.total > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>{data.total.toLocaleString()} events</span>
              <div className="flex items-center gap-2">
                <Button id="admin-logs-prev" variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>Previous</Button>
                <span>Page {page} of {totalPages}</span>
                <Button id="admin-logs-next" variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => current + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <LogDetailSheet
        entry={selected}
        onClose={() => setSelected(null)}
        onTraceUser={(entry) => { setSelected(null); setFilter('actorId', entry.actorId); }}
        onFilterIp={(ip) => { setSelected(null); setFilter('q', ip); }}
      />
    </div>
  );
}

export default function AdminLogsPage() {
  return <Suspense fallback={<Skeleton className="h-96 w-full" />}><LogsExplorer /></Suspense>;
}
