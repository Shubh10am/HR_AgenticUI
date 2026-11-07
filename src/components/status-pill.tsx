import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  bad: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
} as const;
export type PillTone = keyof typeof TONES;

/** A small coloured status label. */
export default function StatusPill({ tone, children, className }: { tone: PillTone; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold', TONES[tone], className)}>{children}</span>;
}
