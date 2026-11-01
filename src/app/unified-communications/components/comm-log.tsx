'use client';

import { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ExternalLink, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CommItem, CommPlatform } from '@/lib/communications';
import PlatformIcon from './platform-icon';

const typeVariant = (type: string) => (type.startsWith('Received · unread') || type === 'Upcoming meeting' ? 'default' : type === 'Sent' || type.startsWith('Post') ? 'secondary' : 'outline');

function When({ at }: { at: string }) {
  const date = new Date(at);
  const future = date.getTime() > Date.now();
  return (
    <time dateTime={at} title={format(date, 'PPpp')}>
      {future ? `in ${formatDistanceToNow(date)}` : `${formatDistanceToNow(date)} ago`}
    </time>
  );
}

function open(item: CommItem) {
  if (!item.link) return;
  if (item.link.startsWith('http')) window.open(item.link, '_blank', 'noopener,noreferrer');
  else window.location.assign(item.link);
}

export default function CommLog({ items, isLoading }: { items: CommItem[] | null; isLoading: boolean }) {
  const [platform, setPlatform] = useState<CommPlatform | 'All'>('All');
  const [query, setQuery] = useState('');

  const platforms = useMemo(() => Array.from(new Set((items ?? []).map((i) => i.platform))), [items]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((i) => (platform === 'All' || i.platform === platform) && (!q || `${i.counterpart} ${i.summary} ${i.type}`.toLowerCase().includes(q)));
  }, [items, platform, query]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-4">
        <div className="space-y-1.5">
          <CardTitle>Recent Communication Logs</CardTitle>
          <CardDescription>Your latest emails, meetings and community activity, newest first. Click a row to open it.</CardDescription>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="comms-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people, subjects…" className="pl-8" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['All', ...platforms] as const).map((p) => (
              <Button key={p} id={`comms-filter-${p.toLowerCase().replace(/\s+/g, '-')}`} size="sm" variant={platform === p ? 'default' : 'outline'} className="h-8 rounded-full" onClick={() => setPlatform(p)}>
                {p}{p !== 'All' && ` (${(items ?? []).filter((i) => i.platform === p).length})`}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {items?.length ? 'Nothing matches these filters.' : 'No communications yet. Connect Google to see your email and meetings here.'}
          </p>
        ) : (
          <div className="rounded-md border">
            <Table scroll id="comms-table" className="min-w-[880px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Platform</TableHead>
                  <TableHead className="w-[170px]">With</TableHead>
                  <TableHead className="min-w-[280px]">Subject / Summary</TableHead>
                  <TableHead className="w-[150px]">Type</TableHead>
                  <TableHead className="w-[150px] text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((item) => (
                  <TableRow key={item.id} id={`comms-row-${item.id}`} onClick={() => open(item)} className={cn(item.link && 'cursor-pointer')}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 whitespace-nowrap"><PlatformIcon platform={item.platform} />{item.platform}</div>
                    </TableCell>
                    <TableCell className="max-w-[170px] truncate" title={item.counterpart}>{item.counterpart}</TableCell>
                    <TableCell>
                      <span className="line-clamp-1" title={item.summary}>{item.summary}</span>
                    </TableCell>
                    <TableCell><Badge variant={typeVariant(item.type)} className="whitespace-nowrap">{item.type}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><When at={item.at} />{item.link?.startsWith('http') && <ExternalLink className="h-3 w-3" />}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
