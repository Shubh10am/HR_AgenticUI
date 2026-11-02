import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { dayKeyOf, isDayKey } from '@/lib/attendance';
import { dayBoard } from '@/services/attendance';

/** The organization's attendance for one day (`?date=YYYY-MM-DD`, default today). */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { organizationId } = req.user;
  if (!organizationId) return res.status(400).json({ error: 'Attendance belongs to an organization.' });
  const dayKey = req.query.date === undefined ? dayKeyOf() : req.query.date;
  if (!isDayKey(dayKey)) return res.status(400).json({ error: 'Use a date like 2026-11-02.' });
  try {
    return res.status(200).json(await dayBoard(organizationId, dayKey));
  } catch (error) {
    console.error('Error fetching attendance board:', error);
    return res.status(500).json({ error: 'Could not load attendance.' });
  }
}

export default withAuth(handler, ['Admin', 'HR']);
