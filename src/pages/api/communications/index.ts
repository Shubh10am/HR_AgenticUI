import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { getCommunicationsFeed } from '@/services/communications/feed';

/** The caller's own communications feed. Scope comes from the token, never the query. */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    return res.status(200).json(await getCommunicationsFeed(req.user.id, req.user.organizationId ?? null));
  } catch (error) {
    console.error('[communications] Feed failed:', error);
    return res.status(500).json({ error: 'Could not load your communications.' });
  }
}

export default withAuth(handler);
