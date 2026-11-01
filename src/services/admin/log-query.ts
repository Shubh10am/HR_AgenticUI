import mongoose, { type FilterQuery, type PipelineStage } from 'mongoose';
import AuditLog, { type IAuditLog } from '@/models/AuditLog';

/** Quick time ranges, in minutes, and the histogram bucket each one uses. */
export const LOG_RANGES = {
  '15m': { minutes: 15, unit: 'minute', binSize: 1 },
  '1h': { minutes: 60, unit: 'minute', binSize: 2 },
  '6h': { minutes: 360, unit: 'minute', binSize: 10 },
  '24h': { minutes: 1440, unit: 'minute', binSize: 30 },
  '7d': { minutes: 10080, unit: 'hour', binSize: 4 },
  '30d': { minutes: 43200, unit: 'day', binSize: 1 },
} as const;

export type LogRange = keyof typeof LOG_RANGES;

const UNIT_MS = { minute: 60_000, hour: 3_600_000, day: 86_400_000 } as const;

/**
 * Every bucket start in the range, so quiet periods show as empty bars rather
 * than being skipped. Matches $dateTrunc, whose bins are aligned to UTC.
 */
function bucketStarts(range: LogRange): number[] {
  const { minutes, unit, binSize } = LOG_RANGES[range];
  const step = UNIT_MS[unit] * binSize;
  const end = Date.now();
  const starts: number[] = [];
  for (let t = Math.floor((end - minutes * 60_000) / step) * step; t <= end; t += step) starts.push(t);
  return starts;
}

export interface LogQuery {
  range: LogRange;
  search?: string;
  organizationId?: string;
  actorId?: string;
  category?: string;
  outcome?: 'success' | 'failure';
  method?: string;
  statusClass?: '2xx' | '3xx' | '4xx' | '5xx';
  page: number;
  limit: number;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Builds the Mongo filter for a log query. Exported for the facet counts, which ignore their own filter. */
export function buildLogFilter(query: LogQuery, omit: (keyof LogQuery)[] = []): FilterQuery<IAuditLog> {
  const use = (key: keyof LogQuery) => !omit.includes(key) && query[key];
  const filter: FilterQuery<IAuditLog> = {
    createdAt: { $gte: new Date(Date.now() - LOG_RANGES[query.range].minutes * 60_000) },
  };
  if (use('organizationId')) {
    filter.organizationId = query.organizationId === 'platform' ? null : new mongoose.Types.ObjectId(query.organizationId);
  }
  if (use('actorId')) filter.actorId = query.actorId;
  if (use('category')) filter.category = query.category;
  if (use('outcome')) filter.outcome = query.outcome;
  if (use('method')) filter.method = query.method;
  if (use('statusClass')) {
    const base = Number(query.statusClass!.charAt(0)) * 100;
    filter.statusCode = { $gte: base, $lt: base + 100 };
  }
  if (use('search')) {
    const pattern = new RegExp(escapeRegex(query.search!.slice(0, 100)), 'i');
    filter.$or = [{ actorName: pattern }, { actorEmail: pattern }, { action: pattern }, { path: pattern }, { ipAddress: pattern }];
  }
  return filter;
}

function facet(filter: FilterQuery<IAuditLog>, field: string, limit = 20): Promise<{ _id: unknown; count: number; name?: string; email?: string }[]> {
  const pipeline: PipelineStage[] = [
    { $match: filter },
    { $group: { _id: `$${field}`, count: { $sum: 1 }, name: { $last: '$actorName' }, email: { $last: '$actorEmail' } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ];
  return AuditLog.aggregate(pipeline);
}

/** Runs a log search: one page of entries plus the histogram, summary stats and facet counts for the same filter. */
export async function searchLogs(query: LogQuery) {
  const filter = buildLogFilter(query);
  const { unit, binSize } = LOG_RANGES[query.range];

  const [entries, total, histogram, statsRows, organizations, users, categories] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).populate('organizationId', 'name').lean(),
    AuditLog.countDocuments(filter),
    AuditLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateTrunc: { date: '$createdAt', unit, binSize } },
          success: { $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, 1, 0] } },
          failure: { $sum: { $cond: [{ $eq: ['$outcome', 'failure'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AuditLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          failures: { $sum: { $cond: [{ $eq: ['$outcome', 'failure'] }, 1, 0] } },
          users: { $addToSet: '$actorId' },
          ips: { $addToSet: '$ipAddress' },
          durations: { $push: '$durationMs' },
        },
      },
    ]),
    facet(buildLogFilter(query, ['organizationId']), 'organizationId'),
    facet(buildLogFilter(query, ['actorId']), 'actorId', 50),
    facet(buildLogFilter(query, ['category']), 'category'),
  ]);

  const orgIds = organizations.map((row) => row._id).filter(Boolean) as mongoose.Types.ObjectId[];
  const orgNames = new Map(
    (await mongoose.model('Organization').find({ _id: { $in: orgIds } }, 'name').lean<{ _id: unknown; name: string }[]>())
      .map((org) => [String(org._id), org.name]),
  );

  const stats = statsRows[0];
  const durations = ((stats?.durations ?? []) as (number | null)[]).filter((value): value is number => typeof value === 'number').sort((a, b) => a - b);
  const percentile = (p: number) => (durations.length ? durations[Math.min(durations.length - 1, Math.floor((p / 100) * durations.length))] : null);

  return {
    entries: entries.map((entry) => ({
      ...entry,
      _id: String(entry._id),
      organizationId: entry.organizationId ? String((entry.organizationId as unknown as { _id: unknown })._id) : null,
      organizationName: (entry.organizationId as unknown as { name?: string } | null)?.name ?? 'Platform',
    })),
    total,
    page: query.page,
    limit: query.limit,
    histogram: (() => {
      const counts = new Map(histogram.map((bucket) => [new Date(bucket._id).getTime(), bucket]));
      return bucketStarts(query.range).map((start) => ({
        time: new Date(start).toISOString(),
        success: counts.get(start)?.success ?? 0,
        failure: counts.get(start)?.failure ?? 0,
      }));
    })(),
    bucket: { unit, binSize },
    stats: {
      total: stats?.total ?? 0,
      failures: stats?.failures ?? 0,
      uniqueUsers: stats?.users.length ?? 0,
      uniqueIps: stats?.ips.filter(Boolean).length ?? 0,
      p50: percentile(50),
      p95: percentile(95),
    },
    facets: {
      organizations: organizations.map((row) => ({
        id: row._id ? String(row._id) : 'platform',
        name: row._id ? orgNames.get(String(row._id)) ?? 'Deleted organization' : 'Platform',
        count: row.count,
      })),
      users: users.map((row) => ({ id: String(row._id), name: row.name || 'Unknown user', email: row.email ?? '', count: row.count })),
      categories: categories.map((row) => ({ name: String(row._id), count: row.count })),
    },
  };
}

export type LogSearchResult = Awaited<ReturnType<typeof searchLogs>>;
