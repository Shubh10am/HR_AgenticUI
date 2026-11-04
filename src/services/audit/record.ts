import type { NextApiRequest } from 'next';
import mongoose from 'mongoose';
import AuditLog from '@/models/AuditLog';
import { describeAction } from './describe';

export interface AuditActor {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  organizationId?: string | null;
}

/** Methods that change data; reads are not logged. */
export const AUDITED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** The caller's IP: the first X-Forwarded-For hop (set by the hosting proxy), else the socket address. */
export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  const realIp = req.headers['x-real-ip'];
  const ip = first || (Array.isArray(realIp) ? realIp[0] : realIp) || req.socket?.remoteAddress || '';
  return ip.replace(/^::ffff:/, '');
}

/** The request path without its query string, which may carry search terms. */
export function requestPath(req: NextApiRequest): string {
  return (req.url ?? '').split('?')[0];
}

/**
 * Saves one audit entry. Never throws: a failed write is logged and the
 * user's request carries on unaffected.
 */
export async function recordAudit(
  req: NextApiRequest,
  actor: AuditActor,
  statusCode: number,
  durationMs: number | null = null,
  options: { anonymous?: boolean } = {}
): Promise<void> {
  try {
    const method = (req.method ?? 'GET').toUpperCase();
    const path = requestPath(req);
    const { action, category } = describeAction(method, path);
    const organizationId =
      actor.organizationId && mongoose.Types.ObjectId.isValid(actor.organizationId)
        ? new mongoose.Types.ObjectId(actor.organizationId)
        : null;
    const userAgent = req.headers['user-agent'];

    await AuditLog.create({
      organizationId,
      actorId: actor.id,
      actorName: actor.name ?? '',
      actorEmail: actor.email ?? '',
      actorRole: actor.role ?? '',
      action,
      category,
      method,
      path,
      statusCode,
      durationMs,
      outcome: statusCode < 400 ? 'success' : 'failure',
      ipAddress: options.anonymous ? '' : getClientIp(req),
      userAgent: options.anonymous ? '' : (Array.isArray(userAgent) ? userAgent[0] : userAgent ?? '').slice(0, 300),
    });
  } catch (error) {
    console.error('[audit] Failed to record audit entry:', error);
  }
}
