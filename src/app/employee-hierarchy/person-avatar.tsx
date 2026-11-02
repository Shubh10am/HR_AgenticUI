import type { OrgPerson } from '@/lib/hierarchy';
import { cn } from '@/lib/utils';

const PALETTE = [
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
];

/** A stable colour per department, so teams are easy to spot across the chart. */
export function departmentTone(department: string) {
  let hash = 0;
  for (const char of department || '—') hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join('');

export default function PersonAvatar({ person, className }: { person: Pick<OrgPerson, 'name' | 'department'>; className?: string }) {
  return (
    <span aria-hidden className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-2 ring-background', departmentTone(person.department), className)}>
      {initials(person.name)}
    </span>
  );
}
