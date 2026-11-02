import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { updateReportingLine } from '@/services/hierarchy';

/** Sets who a person reports to, or their job title. */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  const { organizationId } = req.user;
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!organizationId) return res.status(400).json({ error: 'The org chart belongs to an organization.' });
  try {
    const error = await updateReportingLine(organizationId, String(req.query.id), req.body ?? {});
    if (error) return res.status(400).json({ error });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[hierarchy] Could not update reporting line:', error);
    return res.status(500).json({ error: 'Could not save the change.' });
  }
}

export default withAuth(handler, ['Admin', 'HR']);
