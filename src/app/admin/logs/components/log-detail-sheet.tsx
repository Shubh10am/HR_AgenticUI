'use client';

import { format } from 'date-fns';
import { Copy, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { describeDevice } from '@/app/audit-log/device';
import type { LogEntry } from '../types';

function Attribute({ name, value, mono }: { name: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{name}</dt>
      <dd className={mono ? 'break-all font-mono text-xs leading-5' : 'break-words'}>{value || '—'}</dd>
    </div>
  );
}

/** Side panel with every attribute of one log entry and a shortcut to trace the user. */
export default function LogDetailSheet({ entry, onClose, onTraceUser, onFilterIp }: {
  entry: LogEntry | null;
  onClose: () => void;
  onTraceUser: (entry: LogEntry) => void;
  onFilterIp: (ip: string) => void;
}) {
  return (
    <Sheet open={Boolean(entry)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {entry && (
          <>
            <SheetHeader>
              <SheetTitle>{entry.action}</SheetTitle>
              <SheetDescription>{format(new Date(entry.createdAt), "EEEE d MMMM yyyy 'at' HH:mm:ss")}</SheetDescription>
            </SheetHeader>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={entry.outcome === 'success' ? 'secondary' : 'destructive'}>{entry.outcome === 'success' ? 'Succeeded' : 'Failed'} · {entry.statusCode}</Badge>
              <Badge variant="outline">{entry.category}</Badge>
              {entry.durationMs != null && <Badge variant="outline">{entry.durationMs} ms</Badge>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button id="admin-logs-trace-user" size="sm" onClick={() => onTraceUser(entry)}><Route className="mr-2 h-4 w-4" />Trace this user</Button>
              {entry.ipAddress && <Button id="admin-logs-filter-ip" size="sm" variant="outline" onClick={() => onFilterIp(entry.ipAddress)}>All activity from this IP</Button>}
              <Button id="admin-logs-copy-entry" size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(JSON.stringify(entry, null, 2))}><Copy className="mr-2 h-4 w-4" />Copy JSON</Button>
            </div>

            <h3 className="mt-6 text-sm font-semibold">User</h3>
            <dl className="mt-1">
              <Attribute name="Name" value={entry.actorName} />
              <Attribute name="Email" value={entry.actorEmail} />
              <Attribute name="Role" value={entry.actorRole} />
              <Attribute name="Organization" value={entry.organizationName} />
              <Attribute name="User ID" value={entry.actorId} mono />
            </dl>

            <h3 className="mt-6 text-sm font-semibold">Request</h3>
            <dl className="mt-1">
              <Attribute name="Method" value={entry.method} mono />
              <Attribute name="Path" value={entry.path} mono />
              <Attribute name="Status" value={String(entry.statusCode)} mono />
              <Attribute name="Duration" value={entry.durationMs == null ? '' : `${entry.durationMs} ms`} />
              <Attribute name="IP address" value={entry.ipAddress} mono />
              <Attribute name="Device" value={describeDevice(entry.userAgent)} />
              <Attribute name="User agent" value={entry.userAgent} mono />
              <Attribute name="Entry ID" value={entry._id} mono />
            </dl>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
