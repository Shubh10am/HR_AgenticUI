import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePlatformAdmin } from '@/lib/platform-admin';
import { getSystemHealth } from '@/services/admin/system-health';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requirePlatformAdmin(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(await getSystemHealth());
  } catch (error) {
    console.error('[admin] Health check failed:', error);
    return res.status(500).json({ error: 'Health check failed.' });
  }
}
