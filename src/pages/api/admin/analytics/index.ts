import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platform-admin';
import { getPlatformMetrics } from '@/services/admin/platform-metrics';

const ALLOWED_PERIODS = new Set([1, 7, 30, 90]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requirePlatformAdmin(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // "all" (or anything unrecognised) means all time.
  const requested = parseInt(String(req.query.days ?? '7'), 10);
  const periodDays = ALLOWED_PERIODS.has(requested) ? requested : null;

  try {
    await dbConnect();
    return res.status(200).json(await getPlatformMetrics(periodDays));
  } catch (error) {
    console.error('[admin] Failed to load platform metrics:', error);
    return res.status(500).json({ error: 'Could not load platform metrics.' });
  }
}
