'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { dayKeyOf, dayKeysBetween, isWeekend } from '@/lib/attendance';
import type { AwayEntry, HolidayView } from '@/lib/leave';
import { cn } from '@/lib/utils';

const shiftMonth = (month: string, by: number) => {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + by, 1));
  return date.toISOString().slice(0, 7);
};

/** A month grid of who is away. Leave types are not shown. */
export default function TeamCalendar({ load, holidays }: { load: (month: string) => Promise<AwayEntry[] | null>; holidays: HolidayView[] }) {
  const [month, setMonth] = useState(dayKeyOf().slice(0, 7));
  const [entries, setEntries] = useState<AwayEntry[] | null>(null);
  useEffect(() => {
    setEntries(null);
    void load(month).then((next) => setEntries(next ?? []));
  }, [load, month]);

  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days = dayKeysBetween(`${month}-01`, `${month}-${String(last).padStart(2, '0')}`);
  const holidaySet = new Set(holidays.map((holiday) => holiday.date));
  const people = [...new Map((entries ?? []).map((entry) => [entry.employee.id, entry.employee])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const today = dayKeyOf();

  return (
    <Card className="overflow-x-auto p-4">
      <div className="mb-3 flex items-center gap-2">
        <Button id="leave-calendar-prev" variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft /></Button>
        <span className="w-36 text-center font-semibold">{new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
        <Button id="leave-calendar-next" variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight /></Button>
        <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary" /> Away</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary/30" /> Pending</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-200 dark:bg-amber-500/30" /> Holiday</span>
        </span>
      </div>
      {!entries ? (
        <Loader2 className="m-6 h-5 w-5 animate-spin text-primary" />
      ) : people.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Nobody you can see is away this month.</p>
      ) : (
        <table className="w-full border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card pr-2 text-left font-medium text-muted-foreground">Person</th>
              {days.map((day) => <th key={day} className={cn('w-6 text-center font-normal', day === today ? 'font-bold text-primary' : 'text-muted-foreground')}>{Number(day.slice(8))}</th>)}
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id}>
                <td className="sticky left-0 whitespace-nowrap bg-card pr-2 font-medium">{person.name}</td>
                {days.map((day) => {
                  const entry = entries.find((item) => item.employee.id === person.id && item.startDate <= day && item.endDate >= day);
                  const closed = isWeekend(day) || holidaySet.has(day);
                  return (
                    <td
                      key={day}
                      title={entry ? `${person.name} · ${entry.pending ? 'pending' : 'away'}` : holidaySet.has(day) ? holidays.find((h) => h.date === day)?.name : undefined}
                      className={cn('h-6 rounded', entry && !closed ? (entry.pending ? 'bg-primary/30' : 'bg-primary') : holidaySet.has(day) ? 'bg-amber-200 dark:bg-amber-500/30' : isWeekend(day) ? 'bg-muted/60' : 'bg-muted/20')}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
