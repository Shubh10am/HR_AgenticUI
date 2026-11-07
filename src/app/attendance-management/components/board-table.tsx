'use client';

import { useMemo, useState } from 'react';
import { Pencil, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PersonAvatar from '@/components/person-avatar';
import { ATTENDANCE_RULES, DAY_STATUS_LABEL, formatClock, formatMinutes, isLateClockIn, type BoardRow, type DayStatus } from '@/lib/attendance';
import { cn } from '@/lib/utils';
import StatusBadge from './status-badge';

const FILTERS: { id: string; label: string; statuses: DayStatus[] | null }[] = [
  { id: 'all', label: 'Everyone', statuses: null },
  { id: 'in', label: 'Clocked in', statuses: ['present', 'late', 'early-departure', 'working', 'no-clock-out'] },
  { id: 'late', label: 'Late', statuses: ['late'] },
  { id: 'attention', label: 'Needs attention', statuses: ['no-clock-out', 'early-departure', 'absent'] },
  { id: 'leave', label: 'On leave', statuses: ['on-leave'] },
  { id: 'away', label: 'Not in', statuses: ['absent', 'not-in-yet'] },
];

interface BoardTableProps {
  rows: BoardRow[];
  canAdjust: boolean;
  onAdjust: (row: BoardRow) => void;
  onOpen: (row: BoardRow) => void;
}

export default function BoardTable({ rows, canAdjust, onAdjust, onOpen }: BoardTableProps) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const chosen = FILTERS.find((candidate) => candidate.id === filter)!;
    const needle = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (filter === 'late' ? lateFlag(row) : !chosen.statuses || chosen.statuses.includes(row.status)) &&
        (!needle || `${row.name} ${row.email} ${row.department}`.toLowerCase().includes(needle))
    );
  }, [rows, filter, query]);

  const countFor = (id: string) => {
    const chosen = FILTERS.find((candidate) => candidate.id === id)!;
    return id === 'late' ? rows.filter(lateFlag).length : chosen.statuses ? rows.filter((row) => chosen.statuses!.includes(row.status)).length : rows.length;
  };

  return (
    <Card>
      <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Team attendance</CardTitle>
          <CardDescription>Times in {ATTENDANCE_RULES.timeZoneLabel}. Click a person to open their profile{canAdjust ? ', or correct their day with the pencil' : ''}.</CardDescription>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="attendance-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or team" className="pl-9" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              id={`attendance-filter-${option.id}`}
              onClick={() => setFilter(option.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filter === option.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/40'
              )}
            >
              {option.label} <span className="opacity-70">{countFor(option.id)}</span>
            </button>
          ))}
        </div>
        <div className="rounded-md border">
          <Table id="attendance-board-table" scroll className="min-w-[760px] [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Clock in</TableHead>
                <TableHead>Clock out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                {canAdjust && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canAdjust ? 7 : 6} className="h-24 text-center text-muted-foreground">
                    Nobody matches this filter.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((row) => (
                  <TableRow key={row.employeeId} id={`attendance-row-${row.employeeId}`} onClick={() => onOpen(row)} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <PersonAvatar person={row} className="h-8 w-8 text-xs" />
                        <div className="min-w-0">
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{row.department || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className={cn('tabular-nums', row.clockIn && lateFlag(row) && 'font-medium text-amber-600 dark:text-amber-400')}>{formatClock(row.clockIn)}</TableCell>
                    <TableCell className="tabular-nums">{formatClock(row.clockOut)}</TableCell>
                    <TableCell className="tabular-nums">{formatMinutes(row.minutes)}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} detail={row.leaveType} />
                      {row.adjustedBy && <span className="ml-2 text-[11px] text-muted-foreground" title={`Corrected by ${row.adjustedBy}${row.notes ? `: ${row.notes}` : ''}`}>edited</span>}
                    </TableCell>
                    {canAdjust && (
                      <TableCell>
                        <Button
                          id={`attendance-row-${row.employeeId}-adjust`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Correct ${row.name}'s attendance`}
                          title={row.status === 'on-leave' ? 'On approved leave' : 'Correct attendance'}
                          onClick={(event) => {
                            event.stopPropagation();
                            onAdjust(row);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Late = clock-in after {ATTENDANCE_RULES.lateAfter}. {DAY_STATUS_LABEL['early-departure']} = under {ATTENDANCE_RULES.fullDayMinutes / 60}h. Weekends are Saturday and Sunday.
        </p>
      </CardContent>
    </Card>
  );
}

/** Late by clock-in time, whatever happened after: a late arrival still working still counts. */
const lateFlag = (row: BoardRow) => row.clockIn !== null && isLateClockIn(new Date(row.clockIn), row.lateAfter);
