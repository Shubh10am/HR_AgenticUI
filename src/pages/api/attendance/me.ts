import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { dayKeyOf } from '@/lib/attendance';
import { myAttendance } from '@/services/attendance';

/** The signed-in person's today and a month of their attendance (`?month=YYYY-MM`). */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { id, organizationId } = req.user;
  if (!organizationId) return res.status(400).json({ error: 'Attendance belongs to an organization.' });
  const month = typeof req.query.month === 'string' ? req.query.month : dayKeyOf().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ error: 'Use a month like 2026-11.' });
  try {
    return res.status(200).json(await myAttendance(id, organizationId, month));
  } catch (error) {
    console.error('Error fetching own attendance:', error);
    return res.status(500).json({ error: 'Could not load your attendance.' });
  }
}

export default withAuth(handler);
