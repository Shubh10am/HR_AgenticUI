import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { clockOut } from '@/services/attendance';

async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const result = await clockOut(req.user.id);
    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.status(200).json({ message: 'Clocked out successfully.', record: result.record });
  } catch (error) {
    console.error('Clock-out error:', error);
    return res.status(500).json({ error: 'Could not clock you out. Please try again.' });
  }
}

export default withAuth(handler);
