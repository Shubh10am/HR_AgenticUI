'use client';

import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { LogEntry } from '../types';

const METHOD_STYLES: Record<string, string> = {
  POST: 'text-sky-600 dark:text-sky-400',
  PUT: 'text-amber-600 dark:text-amber-400',
  PATCH: 'text-amber-600 dark:text-amber-400',
  DELETE: 'text-red-600 dark:text-red-400',
};

/** Dense, monospaced event rows; clicking one opens its details. */
export default function LogTable({ entries, onSelect }: { entries: LogEntry[]; onSelect: (entry: LogEntry) => void }) {
  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          <TableHead id="admin-logs-time-header" className="w-40">Timestamp</TableHead>
          <TableHead id="admin-logs-status-header" className="w-16">Status</TableHead>
          <TableHead id="admin-logs-user-header">User</TableHead>
          <TableHead id="admin-logs-action-header">Action</TableHead>
          <TableHead id="admin-logs-request-header" className="hidden xl:table-cell">Request</TableHead>
          <TableHead id="admin-logs-ip-header" className="w-32">IP</TableHead>
          <TableHead id="admin-logs-duration-header" className="w-16 text-right">Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow
            key={entry._id}
            id={`admin-logs-${entry._id}-row`}
            onClick={() => onSelect(entry)}
            className={cn('cursor-pointer border-l-2', entry.outcome === 'failure' ? 'border-l-red-500' : 'border-l-emerald-500/60')}
          >
            <TableCell className="whitespace-nowrap font-mono">{format(new Date(entry.createdAt), 'dd MMM HH:mm:ss')}</TableCell>
            <TableCell className={cn('font-mono font-semibold', entry.statusCode >= 400 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>{entry.statusCode}</TableCell>
            <TableCell>
              <div className="max-w-[180px] truncate font-medium">{entry.actorName || entry.actorEmail || 'Unknown user'}</div>
              <div className="max-w-[180px] truncate text-muted-foreground">{entry.organizationName}</div>
            </TableCell>
            <TableCell>
              <div className="max-w-[220px] truncate">{entry.action}</div>
              <div className="text-muted-foreground">{entry.category}</div>
            </TableCell>
            <TableCell className="hidden font-mono xl:table-cell">
              <span className={cn('mr-1.5 font-semibold', METHOD_STYLES[entry.method])}>{entry.method}</span>
              <span className="text-muted-foreground">{entry.path}</span>
            </TableCell>
            <TableCell className="font-mono">{entry.ipAddress || '—'}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{entry.durationMs == null ? '—' : `${entry.durationMs}ms`}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
