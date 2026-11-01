import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  id: string;
  title: string;
  value: number | string | null;
  icon: LucideIcon;
  /** Previous-period value; omit or null to hide the comparison. */
  previous?: number | null;
  /** True when a rise is bad news (errors, open tickets). */
  invertTrend?: boolean;
  hint?: string;
  href?: string;
}

export const formatCompact = (value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

function Trend({ value, previous, invert }: { value: number; previous: number; invert?: boolean }) {
  const change = previous === 0 ? (value === 0 ? 0 : null) : ((value - previous) / previous) * 100;
  if (change === 0) return <span className="inline-flex items-center gap-0.5 text-muted-foreground"><Minus className="h-3 w-3" />No change</span>;
  const isUp = value > previous;
  const isGood = invert ? !isUp : isUp;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-medium', isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
      <Icon className="h-3 w-3" />{change === null ? 'New' : `${Math.abs(change).toFixed(change > -10 && change < 10 ? 1 : 0)}%`}
    </span>
  );
}

/** A metric tile with an optional comparison against the previous period. */
export default function KpiCard({ id, title, value, icon: Icon, previous, invertTrend, hint, href }: KpiCardProps) {
  const body = (
    <Card id={id} className={cn('h-full p-5', href && 'transition-shadow hover:shadow-md')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
      </div>
      {value === null ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="mt-1 font-display text-3xl font-bold tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      )}
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
        {typeof value === 'number' && typeof previous === 'number' && <><Trend value={value} previous={previous} invert={invertTrend} /><span>vs previous period</span></>}
        {hint && <span>{hint}</span>}
      </p>
    </Card>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}
