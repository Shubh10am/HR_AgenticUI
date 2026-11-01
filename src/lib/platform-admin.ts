import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, type JwtPayload } from './jwt';

/**
 * A platform administrator signs in from the Admin collection and so has no
 * organization. Checking the role alone is not enough: organization admins
 * also carry the role "Admin", and must never see other organizations' data.
 */
export function isPlatformAdmin(payload: JwtPayload | null): payload is JwtPayload {
  return Boolean(payload && (payload.role === 'SuperAdmin' || payload.role === 'Admin') && payload.organizationId === null);
}

/**
 * Verifies the request comes from a platform administrator, answering 401/403 itself when not.
 *
 * @returns The verified token payload, or null when the response has already been sent.
 */
export function requirePlatformAdmin(req: NextApiRequest, res: NextApiResponse): JwtPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return null;
  }
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
  if (!isPlatformAdmin(payload)) {
    res.status(403).json({ error: 'Forbidden: Access restricted to platform administrators.' });
    return null;
  }
  return payload;
}
