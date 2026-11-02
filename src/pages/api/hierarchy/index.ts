import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { listOrgPeople } from '@/services/hierarchy';

/** The organization's people and reporting lines. Any member can view; Admin and HR can edit. */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  const { organizationId, role } = req.user;
  if (!organizationId) return res.status(400).json({ error: 'The org chart belongs to an organization.' });
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    return res.status(200).json({ people: await listOrgPeople(organizationId), canEdit: role === 'Admin' || role === 'HR' });
  } catch (error) {
    console.error('[hierarchy] Could not load org chart:', error);
    return res.status(500).json({ error: 'Could not load the org chart.' });
  }
}

export default withAuth(handler);
