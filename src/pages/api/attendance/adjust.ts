import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { adjustDay } from '@/services/attendance';

/** Admin/HR correction of one person's day. */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { organizationId, email } = req.user;
  if (!organizationId) return res.status(400).json({ error: 'Attendance belongs to an organization.' });
  try {
    const error = await adjustDay(organizationId, email, req.body ?? {});
    if (error) return res.status(400).json({ error });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Attendance adjustment failed:', error);
    return res.status(500).json({ error: 'Could not save the correction.' });
  }
}

export default withAuth(handler, ['Admin', 'HR']);
