import type { LogSearchResult } from '@/services/admin/log-query';

export type LogEntry = LogSearchResult['entries'][number] & { createdAt: string };
export type LogResult = Omit<LogSearchResult, 'entries'> & { entries: LogEntry[] };

export interface LogFilters {
  range: string;
  q: string;
  organizationId: string;
  actorId: string;
  category: string;
  outcome: string;
  method: string;
  status: string;
}

export const EMPTY_FILTERS: LogFilters = { range: '24h', q: '', organizationId: '', actorId: '', category: '', outcome: '', method: '', status: '' };

export const RANGE_OPTIONS = [
  { value: '15m', label: 'Last 15 minutes' },
  { value: '1h', label: 'Last 1 hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];
