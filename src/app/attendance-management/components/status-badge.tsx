import { DAY_STATUS_LABEL, type DayStatus } from '@/lib/attendance';
import { cn } from '@/lib/utils';

const TONE: Record<DayStatus, string> = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  working: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  late: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  'early-departure': 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  'no-clock-out': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  'on-leave': 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  absent: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  'not-in-yet': 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  weekend: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400',
  upcoming: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400',
};

export const STATUS_DOT: Record<DayStatus, string> = {
  present: 'bg-emerald-500',
  working: 'bg-sky-500',
  late: 'bg-amber-500',
  'early-departure': 'bg-orange-500',
  'no-clock-out': 'bg-fuchsia-500',
  'on-leave': 'bg-violet-500',
  absent: 'bg-red-500',
  'not-in-yet': 'bg-slate-400',
  weekend: 'bg-slate-300',
  upcoming: 'bg-slate-200',
};

export default function StatusBadge({ status, detail }: { status: DayStatus; detail?: string | null }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', TONE[status])}>
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status], status === 'working' && 'animate-pulse')} />
      {DAY_STATUS_LABEL[status]}
      {detail && <span className="opacity-75">· {detail}</span>}
    </span>
  );
}
