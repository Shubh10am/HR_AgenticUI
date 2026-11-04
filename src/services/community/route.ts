import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { CommunityError, type Viewer } from './feed';

type Handler = (viewer: Viewer, req: NextApiRequestWithAuth) => Promise<unknown>;

/**
 * Wraps a community API route: checks the method, builds the viewer from the session,
 * and turns a CommunityError into its 4xx.
 */
export function communityRoute(handlers: Partial<Record<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', Handler>>) {
  return withAuth(async (req: NextApiRequestWithAuth, res: NextApiResponse) => {
    const handler = handlers[req.method as keyof typeof handlers];
    if (!handler) {
      res.setHeader('Allow', Object.keys(handlers));
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    const { id, organizationId, role } = req.user;
    if (!organizationId) return res.status(400).json({ error: 'The community belongs to an organisation.' });
    try {
      const body = await handler({ id, organizationId: String(organizationId), role }, req);
      return res.status(200).json(body ?? { ok: true });
    } catch (error) {
      if (error instanceof CommunityError) return res.status(error.status).json({ error: error.message });
      console.error(`[community] ${req.method} ${req.url} failed:`, error);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  });
}
