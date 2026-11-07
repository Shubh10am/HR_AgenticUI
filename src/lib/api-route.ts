import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';

/** A refusal an API route turns into a 4xx with this message. */
export class ApiError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/** The signed-in organisation member a request acts for. */
export interface Viewer {
  id: string;
  organizationId: string;
  role: string;
  name: string;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Handler = (viewer: Viewer, req: NextApiRequestWithAuth) => Promise<unknown>;

/**
 * Wraps an organisation API route: checks the method, builds the viewer from the session,
 * and turns an ApiError into its 4xx. Unexpected errors are logged and answered with 500.
 *
 * @param handlers One handler per allowed method.
 * @param area     Short name used in error logs.
 */
export function apiRoute(handlers: Partial<Record<Method, Handler>>, area = 'api') {
  return withAuth(async (req: NextApiRequestWithAuth, res: NextApiResponse) => {
    const handler = handlers[req.method as Method];
    if (!handler) {
      res.setHeader('Allow', Object.keys(handlers));
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    const { id, organizationId, role, name } = req.user;
    if (!organizationId) return res.status(400).json({ error: 'This feature belongs to an organisation.' });
    try {
      const body = await handler({ id, organizationId: String(organizationId), role, name: name ?? '' }, req);
      return res.status(200).json(body ?? { ok: true });
    } catch (error) {
      if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
      console.error(`[${area}] ${req.method} ${req.url} failed:`, error);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  });
}

/** Refuses unless the viewer holds one of the roles. */
export function requireRole(viewer: Viewer, roles: string[], message = 'You do not have access to this.') {
  if (!roles.includes(viewer.role) && viewer.role !== 'SuperAdmin') throw new ApiError(message, 403);
}

export const isPeopleTeam = (role: string) => role === 'Admin' || role === 'HR' || role === 'SuperAdmin';
