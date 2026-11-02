'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { demoAttendanceBoard, isGuestToken } from '@/lib/guest-demo';
import { ATTENDANCE_RULES, DAY_STATUS_LABEL, dayKeyOf, formatClock, formatMinutes, storedDateOf, type BoardRow, type DayBoard } from '@/lib/attendance';
import SummaryTiles from './components/summary-tiles';
import BoardTable from './components/board-table';
import AdjustDialog, { type AdjustChange } from './components/adjust-dialog';

const shiftDay = (dayKey: string, days: number) => new Date(storedDateOf(dayKey).getTime() + days * 86_400_000).toISOString().slice(0, 10);
const dayLabelOf = (dayKey: string) =>
  storedDateOf(dayKey).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Today's board refreshes on its own so "working now" and "not in yet" stay current. */
const AUTO_REFRESH_MS = 60_000;

export default function AttendanceManagementPage() {
  const { toast } = useToast();
  const { token } = useAuth();
  const router = useRouter();
  const isGuest = isGuestToken(token);

  const today = dayKeyOf();
  const [dayKey, setDayKey] = useState(today);
  const [board, setBoard] = useState<DayBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<BoardRow | null>(null);

  const load = useCallback(
    async (quiet = false) => {
      if (isGuest) {
        setBoard(demoAttendanceBoard(dayKey));
        setIsLoading(false);
        return;
      }
      if (!quiet) setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/attendance/dashboard?date=${dayKey}`, { headers: { Authorization: `Bearer ${token}` } });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Could not load attendance.');
        setBoard(body);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load attendance.');
      } finally {
        setIsLoading(false);
      }
    },
    [dayKey, isGuest, token]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (dayKey !== today) return;
    const timer = setInterval(() => void load(true), AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [dayKey, today, load]);

  const saveAdjustment = async (row: BoardRow, change: AdjustChange): Promise<string | null> => {
    if (isGuest) return 'Sign in to correct attendance. This is sample data.';
    const response = await fetch('/api/attendance/adjust', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: row.employeeId, dayKey, ...change }),
    });
    if (!response.ok) return (await response.json().catch(() => ({}))).error ?? 'Could not save the correction.';
    toast({ title: change.clear ? 'Record removed' : 'Attendance corrected', description: `${row.name} · ${dayLabelOf(dayKey)}` });
    await load(true);
    return null;
  };

  const exportCsv = () => {
    if (!board) return;
    const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const lines = [
      ['Employee', 'Email', 'Department', `Clock in (${ATTENDANCE_RULES.timeZoneLabel})`, `Clock out (${ATTENDANCE_RULES.timeZoneLabel})`, 'Hours', 'Status', 'Leave type', 'Note'],
      ...board.rows.map((row) => [
        row.name,
        row.email,
        row.department,
        row.clockIn ? formatClock(row.clockIn) : '',
        row.clockOut ? formatClock(row.clockOut) : '',
        row.minutes == null ? '' : formatMinutes(row.minutes),
        DAY_STATUS_LABEL[row.status],
        row.leaveType ?? '',
        row.notes ?? '',
      ]),
    ];
    const blob = new Blob([lines.map((line) => line.map(cell).join(',')).join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-${dayKey}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <PageHeader title="Attendance Management" description={`Who's in, who's late and who's away — ${dayLabelOf(dayKey)}.`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border bg-background">
            <Button id="attendance-day-prev" variant="ghost" size="icon" aria-label="Previous day" onClick={() => setDayKey(shiftDay(dayKey, -1))}>
              <ChevronLeft />
            </Button>
            <Input
              id="attendance-day-picker"
              type="date"
              value={dayKey}
              max={today}
              onChange={(event) => event.target.value && setDayKey(event.target.value)}
              className="h-9 w-40 border-0 shadow-none focus-visible:ring-0"
              aria-label="Choose a day"
            />
            <Button id="attendance-day-next" variant="ghost" size="icon" aria-label="Next day" disabled={dayKey >= today} onClick={() => setDayKey(shiftDay(dayKey, 1))}>
              <ChevronRight />
            </Button>
          </div>
          {dayKey !== today && (
            <Button id="attendance-day-today" variant="outline" onClick={() => setDayKey(today)}>
              Today
            </Button>
          )}
          <Button id="attendance-export" variant="outline" onClick={exportCsv} disabled={!board}>
            <Download /> CSV
          </Button>
          <Button id="attendance-refresh" variant="outline" onClick={() => void load()} disabled={isLoading}>
            <RefreshCw className={isLoading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </PageHeader>
      {isGuest && <GuestSampleNotice what="the attendance board" />}

      {isLoading && !board ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" /> Loading attendance…
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="mt-2 font-semibold text-destructive">Couldn&apos;t load attendance</p>
          <p className="text-sm text-destructive/80">{error}</p>
          <Button onClick={() => void load()} variant="outline" className="mt-4">
            <RefreshCw /> Try again
          </Button>
        </div>
      ) : (
        board && (
          <>
            <SummaryTiles summary={board.summary} isToday={dayKey === today} />
            <BoardTable
              rows={board.rows}
              canAdjust
              onAdjust={setAdjusting}
              onOpen={(row) => !row.employeeId.startsWith('demo-') && router.push(`/manage-employees/${row.employeeId}`)}
            />
          </>
        )
      )}

      <AdjustDialog row={adjusting} dayLabel={dayLabelOf(dayKey)} onClose={() => setAdjusting(null)} onSave={saveAdjustment} />
    </>
  );
}
