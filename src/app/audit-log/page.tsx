'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, Globe, Lock, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/auth-context';
import { describeDevice } from './device';

interface AuditEntry {
  _id: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  category: string;
  method: string;
  path: string;
  statusCode: number;
  outcome: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface AuditResponse {
  entries: AuditEntry[];
  total: number;
  page: number;
  limit: number;
  categories: string[];
  scope: 'organization' | 'self';
  retentionDays: number;
}

const PAGE_SIZE = 25;
const ALL = 'all';

function toCsv(entries: AuditEntry[]): string {
  const header = ['Date', 'Time', 'User', 'Email', 'Role', 'Action', 'Category', 'Result', 'Status', 'IP address', 'Device'];
  const rows = entries.map((entry) => {
    const at = new Date(entry.createdAt);
    return [format(at, 'yyyy-MM-dd'), format(at, 'HH:mm:ss'), entry.actorName, entry.actorEmail, entry.actorRole, entry.action, entry.category, entry.outcome, String(entry.statusCode), entry.ipAddress, describeDevice(entry.userAgent)];
  });
  return [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default function AuditLogPage() {
  const { token } = useAuth();
  const isGuest = !token || token.startsWith('guest-');

  const [data, setData] = useState<AuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);
  const [outcome, setOutcome] = useState(ALL);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const buildParams = useCallback((pageNumber: number, limit: number) => {
    const params = new URLSearchParams({ page: String(pageNumber), limit: String(limit) });
    if (query) params.set('q', query);
    if (category !== ALL) params.set('category', category);
    if (outcome !== ALL) params.set('outcome', outcome);
    if (fromDate) params.set('from', new Date(`${fromDate}T00:00:00`).toISOString());
    if (toDate) params.set('to', new Date(`${toDate}T23:59:59.999`).toISOString());
    return params;
  }, [query, category, outcome, fromDate, toDate]);

  const fetchPage = useCallback(async (pageNumber: number, limit: number): Promise<AuditResponse> => {
    const response = await fetch(`/api/audit-logs?${buildParams(pageNumber, limit)}`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
    return body as AuditResponse;
  }, [buildParams, token]);

  const load = useCallback(async () => {
    if (isGuest) return;
    setIsLoading(true);
    try {
      setData(await fetchPage(page, PAGE_SIZE));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the audit log.');
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, fetchPage, page]);

  useEffect(() => { load(); }, [load]);

  // Any filter change starts again from the first page.
  useEffect(() => { setPage(1); }, [query, category, outcome, fromDate, toDate]);

  const exportCsv = async () => {
    const all = await fetchPage(1, 100).catch(() => null);
    if (!all) return;
    const blob = new Blob([toCsv(all.entries)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm(''); setQuery(''); setCategory(ALL); setOutcome(ALL); setFromDate(''); setToDate('');
  };

  if (isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit Log" description="A record of who did what, when and from where." />
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Sign in to view the audit log</p>
          <p className="text-sm text-muted-foreground">Activity is only recorded for signed-in accounts.</p>
        </Card>
      </div>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const hasFilters = Boolean(query || category !== ALL || outcome !== ALL || fromDate || toDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description={data?.scope === 'self' ? 'Your own activity: what you changed, when and from where.' : 'Every change made in your organization: who did it, when and from where.'}
      >
        <div className="flex gap-2">
          <Button id="audit-log-refresh" variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button id="audit-log-export" size="sm" onClick={exportCsv} disabled={!data?.total}>
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
        </div>
      </PageHeader>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <form className="relative min-w-[220px] flex-1" onSubmit={(event) => { event.preventDefault(); setQuery(searchTerm.trim()); }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="audit-log-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onBlur={() => setQuery(searchTerm.trim())} placeholder="Search user, email, action or IP" className="pl-9" />
          </form>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="audit-log-category" className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {data?.categories.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger id="audit-log-outcome" className="w-full sm:w-36"><SelectValue placeholder="Result" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All results</SelectItem>
              <SelectItem value="success">Succeeded</SelectItem>
              <SelectItem value="failure">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Input id="audit-log-from" type="date" aria-label="From date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="w-full sm:w-40" />
          <Input id="audit-log-to" type="date" aria-label="To date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="w-full sm:w-40" />
        </div>
        {hasFilters && (
          <Button id="audit-log-clear" variant="link" size="sm" className="mt-2 h-auto px-0" onClick={clearFilters}>Clear filters</Button>
        )}
      </Card>

      {error ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <XCircle className="h-8 w-8 text-destructive" />
          <p className="font-medium">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Try again</Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead id="audit-log-when-header" className="w-44">Date &amp; time</TableHead>
                <TableHead id="audit-log-user-header">User</TableHead>
                <TableHead id="audit-log-action-header">Action</TableHead>
                <TableHead id="audit-log-result-header">Result</TableHead>
                <TableHead id="audit-log-ip-header">IP address</TableHead>
                <TableHead id="audit-log-device-header" className="hidden lg:table-cell">Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && !data ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>{Array.from({ length: 6 }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                ))
              ) : data?.entries.length ? (
                data.entries.map((entry) => {
                  const at = new Date(entry.createdAt);
                  return (
                    <TableRow key={entry._id} id={`audit-log-${entry._id}-row`}>
                      <TableCell>
                        <div className="font-medium">{format(at, 'd MMM yyyy')}</div>
                        <div className="text-xs text-muted-foreground">{format(at, 'HH:mm:ss')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.actorName || 'Unknown user'}</div>
                        <div className="text-xs text-muted-foreground">{entry.actorEmail}{entry.actorRole && ` · ${entry.actorRole}`}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.action}</div>
                        <Badge variant="secondary" className="mt-1 font-normal">{entry.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {entry.outcome === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" />Succeeded</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-destructive" title={`HTTP ${entry.statusCode}`}><XCircle className="h-4 w-4" />Failed</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{entry.ipAddress || '—'}</span>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell" title={entry.userAgent}>{describeDevice(entry.userAgent)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center">
                    <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 font-medium">{hasFilters ? 'No activity matches these filters' : 'No activity recorded yet'}</p>
                    <p className="text-sm text-muted-foreground">Sign-ins and changes will appear here as they happen.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
              <span>{data.total.toLocaleString()} {data.total === 1 ? 'entry' : 'entries'} · kept for {data.retentionDays} days</span>
              <div className="flex items-center gap-2">
                <Button id="audit-log-prev" variant="outline" size="sm" onClick={() => setPage((current) => current - 1)} disabled={page <= 1 || isLoading}><ChevronLeft className="h-4 w-4" /></Button>
                <span>Page {page} of {totalPages}</span>
                <Button id="audit-log-next" variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages || isLoading}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
