import type { LogResult } from '../types';

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bad' }) {
  return (
    <div className="min-w-[110px] flex-1 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-display text-xl font-bold tabular-nums ${tone === 'bad' ? 'text-red-600 dark:text-red-400' : ''}`}>{value}</p>
    </div>
  );
}

/** Summary strip for the current search: volume, error rate, reach and latency. */
export default function LogStats({ stats }: { stats: LogResult['stats'] }) {
  const errorRate = stats.total ? (stats.failures / stats.total) * 100 : 0;
  return (
    <div className="flex flex-wrap divide-x rounded-xl border bg-card">
      <Stat label="Events" value={stats.total.toLocaleString()} />
      <Stat label="Errors" value={stats.failures.toLocaleString()} tone={stats.failures ? 'bad' : undefined} />
      <Stat label="Error rate" value={`${errorRate.toFixed(1)}%`} tone={errorRate >= 5 ? 'bad' : undefined} />
      <Stat label="Users" value={stats.uniqueUsers.toLocaleString()} />
      <Stat label="IP addresses" value={stats.uniqueIps.toLocaleString()} />
      <Stat label="p50 latency" value={stats.p50 === null ? '—' : `${stats.p50} ms`} />
      <Stat label="p95 latency" value={stats.p95 === null ? '—' : `${stats.p95} ms`} />
    </div>
  );
}
