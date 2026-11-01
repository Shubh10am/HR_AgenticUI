import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { getPreferences, parsePreferences, savePreferences, START_PAGES } from '@/services/profile/preferences';

/** The caller's own display preferences. */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  const { id, role } = req.user;
  const isAdmin = role === 'Admin' || role === 'SuperAdmin';
  const startPages = START_PAGES.filter((page) => !page.adminOnly || isAdmin);
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ preferences: await getPreferences(id), startPages });
    }
    if (req.method === 'PUT') {
      const { update, error } = parsePreferences(req.body ?? {}, role);
      if (!update) return res.status(400).json({ error });
      return res.status(200).json({ preferences: await savePreferences(id, update), startPages });
    }
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[profile] Preferences request failed:', error);
    return res.status(500).json({ error: 'Could not update your preferences.' });
  }
}

export default withAuth(handler);
