import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { getProfileOverview } from '@/services/profile/overview';

/** The caller's own join date, last sign-in, recent activity and 30-day stats. */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    return res.status(200).json(await getProfileOverview(req.user.id));
  } catch (error) {
    console.error('[profile] Failed to load overview:', error);
    return res.status(500).json({ error: 'Could not load your activity.' });
  }
}

export default withAuth(handler);
