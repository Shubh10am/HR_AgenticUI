import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { clockIn } from '@/services/attendance';

async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { id: employeeId, organizationId } = req.user;
  if (!organizationId) return res.status(400).json({ error: 'Attendance belongs to an organization.' });
  try {
    const result = await clockIn(employeeId, organizationId);
    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.status(201).json({ message: 'Clocked in successfully.', record: result.record });
  } catch (error) {
    console.error('Clock-in error:', error);
    return res.status(500).json({ error: 'Could not clock you in. Please try again.' });
  }
}

export default withAuth(handler);
