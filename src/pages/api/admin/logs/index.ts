import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platform-admin';
import { LOG_RANGES, searchLogs, type LogQuery, type LogRange } from '@/services/admin/log-query';

const METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const STATUS_CLASSES = new Set(['2xx', '3xx', '4xx', '5xx']);

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? '').trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requirePlatformAdmin(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const range = single(req.query.range);
  const organizationId = single(req.query.organizationId);
  const outcome = single(req.query.outcome);
  const method = single(req.query.method).toUpperCase();
  const statusClass = single(req.query.status);

  const query: LogQuery = {
    range: (range in LOG_RANGES ? range : '24h') as LogRange,
    search: single(req.query.q) || undefined,
    organizationId: organizationId === 'platform' || mongoose.Types.ObjectId.isValid(organizationId) ? organizationId || undefined : undefined,
    actorId: single(req.query.actorId) || undefined,
    category: single(req.query.category) || undefined,
    outcome: outcome === 'success' || outcome === 'failure' ? outcome : undefined,
    method: METHODS.has(method) ? method : undefined,
    statusClass: STATUS_CLASSES.has(statusClass) ? (statusClass as LogQuery['statusClass']) : undefined,
    page: Math.max(1, parseInt(single(req.query.page), 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(single(req.query.limit), 10) || 50)),
  };

  try {
    await dbConnect();
    return res.status(200).json(await searchLogs(query));
  } catch (error) {
    console.error('[admin] Failed to search logs:', error);
    return res.status(500).json({ error: 'Could not search logs.' });
  }
}
