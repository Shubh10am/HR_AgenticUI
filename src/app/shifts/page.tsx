'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, UserPlus } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgApi } from '@/hooks/use-org-api';
import { dayKeyOf, storedDateOf } from '@/lib/attendance';
import { DEFAULT_SHIFT_RULE, WEEKDAYS, type RosterView, type ShiftView } from '@/lib/shifts';
import { cn } from '@/lib/utils';
import ShiftForm, { SHIFT_TONE } from './components/shift-form';
import AssignDialog from './components/assign-dialog';

const shiftWeek = (day: string, by: number) => new Date(storedDateOf(day).getTime() + by * 7 * 86_400_000).toISOString().slice(0, 10);

export default function ShiftsPage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [week, setWeek] = useState(dayKeyOf());
  const [roster, setRoster] = useState<RosterView | null>(null);
  const [shifts, setShifts] = useState<ShiftView[]>([]);
  const [people, setPeople] = useState<{ id: string; name: string; department: string }[]>([]);
  const [assigning, setAssigning] = useState<ShiftView | 'standard' | null>(null);

  const loadRoster = useCallback(async () => {
    if (isGuest) return setRoster({ weekStart: week, days: [], rows: [] });
    setRoster(await run<RosterView>(`/api/shifts/roster?week=${week}`));
  }, [isGuest, run, week]);

  const loadShifts = useCallback(async () => {
    if (isGuest) return;
    const [next, org] = await Promise.all([run<ShiftView[]>('/api/shifts'), isPeopleTeam ? run<{ people: { id: string; name: string; department: string }[] }>('/api/hierarchy') : Promise.resolve(null)]);
    setShifts(next ?? []);
    if (org) setPeople(org.people.map(({ id, name, department }) => ({ id, name, department })));
  }, [isGuest, isPeopleTeam, run]);

  useEffect(() => {
    if (!authLoading) void loadRoster();
  }, [authLoading, loadRoster]);
  useEffect(() => {
    if (!authLoading) void loadShifts();
  }, [authLoading, loadShifts]);

  const toneOf = (shiftId: string | null) => SHIFT_TONE[shifts.find((shift) => shift.id === shiftId)?.color ?? ''] ?? 'bg-muted text-foreground';

  return (
    <>
      <PageHeader title="Shifts & roster" description="Who works when. Attendance uses each person's shift to decide late arrivals and days off." />
      {isGuest && <GuestSampleNotice what="shifts" />}
      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger id="shifts-tab-roster" value="roster">Roster</TabsTrigger>
          <TabsTrigger id="shifts-tab-shifts" value="shifts">Shifts</TabsTrigger>
        </TabsList>
        <TabsContent value="roster" className="mt-4">
          <Card className="overflow-x-auto p-4">
            <div className="mb-3 flex items-center gap-2">
              <Button id="roster-prev" variant="ghost" size="icon" aria-label="Previous week" onClick={() => setWeek(shiftWeek(week, -1))}><ChevronLeft /></Button>
              <span className="w-56 text-center font-semibold">{roster?.days.length ? `${format(storedDateOf(roster.days[0]), 'd MMM')} – ${format(storedDateOf(roster.days[6]), 'd MMM yyyy')}` : '…'}</span>
              <Button id="roster-next" variant="ghost" size="icon" aria-label="Next week" onClick={() => setWeek(shiftWeek(week, 1))}><ChevronRight /></Button>
              {week !== dayKeyOf() && <Button id="roster-today" variant="outline" size="sm" onClick={() => setWeek(dayKeyOf())}>This week</Button>}
            </div>
            {!roster ? (
              <Loader2 className="m-6 h-5 w-5 animate-spin text-primary" />
            ) : (
              <table className="w-full border-separate border-spacing-1 text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-card text-left font-medium text-muted-foreground">Person</th>
                    {roster.days.map((day) => <th key={day} className={cn('min-w-[110px] font-medium', day === dayKeyOf() ? 'text-primary' : 'text-muted-foreground')}>{format(storedDateOf(day), 'EEE d')}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {roster.rows.map((row) => (
                    <tr key={row.employee.id} id={`roster-${row.employee.id}-row`}>
                      <td className="sticky left-0 whitespace-nowrap bg-card pr-2"><p className="font-medium">{row.employee.name}</p><p className="text-muted-foreground">{row.employee.department}</p></td>
                      {row.cells.map((cell, index) => (
                        <td key={index} className={cn('rounded-md px-2 py-1.5 text-center', cell.kind === 'shift' ? toneOf(cell.shiftId) : cell.kind === 'holiday' ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200' : cell.kind === 'away' ? 'bg-primary/15 text-primary' : 'bg-muted/40 text-muted-foreground')}>
                          {cell.label}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="shifts" className="mt-4">
          <div className={cn('grid gap-4', isPeopleTeam && 'lg:grid-cols-[1fr_360px]')}>
            <div className="space-y-3">
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold">Standard</span>
                  <span className="flex-1 text-sm text-muted-foreground">{DEFAULT_SHIFT_RULE.start}–{DEFAULT_SHIFT_RULE.end} · late after {DEFAULT_SHIFT_RULE.lateAfter} · off Sat, Sun · anyone without a shift</span>
                  {isPeopleTeam && <Button id="shift-standard-assign" size="sm" variant="outline" onClick={() => setAssigning('standard')}><UserPlus /> Move people here</Button>}
                </CardContent>
              </Card>
              {shifts.map((shift) => (
                <Card key={shift.id} id={`shift-${shift.id}`}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', SHIFT_TONE[shift.color])}>{shift.name}</span>
                    <span className="flex-1 text-sm text-muted-foreground">
                      {shift.start}–{shift.end} · {shift.graceMinutes} min grace · off {shift.weeklyOff.length ? shift.weeklyOff.map((day) => WEEKDAYS[day]).join(', ') : 'none'} · {shift.assigned} people today
                    </span>
                    {isPeopleTeam && <Button id={`shift-${shift.id}-assign`} size="sm" variant="outline" onClick={() => setAssigning(shift)}><UserPlus /> Assign</Button>}
                  </CardContent>
                </Card>
              ))}
            </div>
            {isPeopleTeam && <ShiftForm onCreate={async (input) => { const next = await run<ShiftView[]>('/api/shifts', 'POST', input, 'Shift created'); if (next) setShifts(next); return !!next; }} />}
          </div>
        </TabsContent>
      </Tabs>
      <AssignDialog
        shift={assigning}
        people={people}
        onOpenChange={(open) => !open && setAssigning(null)}
        onSubmit={async (ids, from) => {
          const ok = await run('/api/shifts/assign', 'POST', { employeeIds: ids, from, shiftId: assigning === 'standard' ? null : assigning?.id }, 'Shift assigned');
          if (ok) await Promise.all([loadShifts(), loadRoster()]);
          return !!ok;
        }}
      />
    </>
  );
}
