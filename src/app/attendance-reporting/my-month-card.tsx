'use client';

import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DAY_STATUS_LABEL, formatClock, formatMinutes, type MyAttendance } from '@/lib/attendance';
import { STATUS_DOT } from '@/app/attendance-management/components/status-badge';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const shiftMonth = (month: string, by: number) => {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + by, 1));
  return date.toISOString().slice(0, 7);
};

interface MyMonthCardProps {
  data: MyAttendance | null;
  month: string;
  isGuest: boolean;
  onMonthChange: (month: string) => void;
}

/** A calendar of the person's own month, coloured by what happened each day. */
export default function MyMonthCard({ data, month, isGuest, onMonthChange }: MyMonthCardProps) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const days = data?.month === month ? data.days : [];
  // Monday-first grid: pad before the 1st.
  const leading = days.length ? (new Date(`${days[0].dayKey}T00:00:00Z`).getUTCDay() + 6) % 7 : 0;
  const summary = data?.month === month ? data.summary : null;

  const stats = [
    { label: 'Days in', value: summary?.present ?? 0, tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Late', value: summary?.late ?? 0, tone: 'text-amber-600 dark:text-amber-400' },
    { label: 'Absent', value: summary?.absent ?? 0, tone: 'text-red-600 dark:text-red-400' },
    { label: 'On leave', value: summary?.onLeave ?? 0, tone: 'text-violet-600 dark:text-violet-400' },
  ];
  const legend = ['present', 'late', 'early-departure', 'no-clock-out', 'on-leave', 'absent'] as const;

  return (
    <Card id="my-attendance-month" className="lg:col-span-1 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center text-xl">
            <CalendarRange className="mr-2 h-6 w-6 text-primary" /> My month
          </CardTitle>
          <div className="flex items-center">
            <Button id="my-attendance-month-prev" variant="ghost" size="icon" className="h-8 w-8" aria-label="Previous month" onClick={() => onMonthChange(shiftMonth(month, -1))}>
              <ChevronLeft />
            </Button>
            <Button id="my-attendance-month-next" variant="ghost" size="icon" className="h-8 w-8" aria-label="Next month" disabled={month >= thisMonth} onClick={() => onMonthChange(shiftMonth(month, 1))}>
              <ChevronRight />
            </Button>
          </div>
        </div>
        <CardDescription>{isGuest ? 'Sign in to see your own attendance.' : monthLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg bg-secondary/40 p-2">
              <p className={cn('text-xl font-bold', stat.tone)}>{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium uppercase text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leading }, (_, index) => (
              <span key={`pad-${index}`} />
            ))}
            {days.map((day) => (
              <div
                key={day.dayKey}
                id={`my-attendance-day-${day.dayKey}`}
                title={`${day.dayKey}: ${DAY_STATUS_LABEL[day.status]}${day.clockIn ? ` · in ${formatClock(day.clockIn)}` : ''}${day.clockOut ? ` · out ${formatClock(day.clockOut)}` : ''}${day.minutes != null ? ` · ${formatMinutes(day.minutes)}` : ''}`}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-md border text-xs',
                  day.status === 'weekend' || day.status === 'upcoming' ? 'border-transparent text-muted-foreground/60' : 'bg-card'
                )}
              >
                {Number(day.dayKey.slice(8))}
                {day.status !== 'weekend' && day.status !== 'upcoming' && <span className={cn('mt-0.5 h-1.5 w-1.5 rounded-full', STATUS_DOT[day.status])} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {legend.map((status) => (
            <span key={status} className="flex items-center gap-1">
              <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} /> {DAY_STATUS_LABEL[status]}
            </span>
          ))}
        </div>
        {summary && (
          <p className="text-xs text-muted-foreground">
            Average day: <span className="font-medium text-foreground">{formatMinutes(summary.averageMinutes)}</span>
            {summary.noClockOut > 0 && <> · {summary.noClockOut} day(s) without a clock-out — use Request Correction.</>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
