import { CalendarCheck, Clock, Palmtree, Percent, UserX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ATTENDANCE_RULES, type DaySummary } from '@/lib/attendance';

export default function SummaryTiles({ summary, isToday }: { summary: DaySummary; isToday: boolean }) {
  const away = summary.absent + summary.notInYet;
  const tiles: { id: string; label: string; value: string; hint: string; icon: LucideIcon }[] = [
    { id: 'in', label: 'Clocked in', value: `${summary.in}`, hint: `of ${summary.total - summary.onLeave} expected`, icon: CalendarCheck },
    { id: 'late', label: 'Late', value: `${summary.late}`, hint: `after ${ATTENDANCE_RULES.lateAfter} ${ATTENDANCE_RULES.timeZoneLabel}`, icon: Clock },
    { id: 'leave', label: 'On leave', value: `${summary.onLeave}`, hint: 'approved leave', icon: Palmtree },
    {
      id: 'away',
      label: isToday && summary.notInYet > 0 ? 'Not in yet' : 'Absent',
      value: `${away}`,
      hint: isToday && summary.notInYet > 0 ? `absent after ${ATTENDANCE_RULES.lateAfter}` : 'no clock-in, no leave',
      icon: UserX,
    },
    { id: 'rate', label: 'Attendance', value: summary.rate == null ? '—' : `${summary.rate}%`, hint: summary.rate == null ? 'not a workday' : 'of people expected', icon: Percent },
  ];
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((tile) => (
        <Card key={tile.id} id={`attendance-stat-${tile.id}`} className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <tile.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-none">{tile.value}</p>
            <p className="mt-1 truncate text-xs font-medium">{tile.label}</p>
            <p className="truncate text-[11px] text-muted-foreground">{tile.hint}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
