import mongoose from 'mongoose';
import type { NextApiResponse } from 'next';
import type { NextApiRequestWithAuth } from '@/lib/withAuth';

export const KNOWLEDGE_EDITOR_ROLES = ['Admin', 'HR'];
export const MAX_DOCUMENT_CHARS = 2_000_000;
export const ALLOWED_MIME_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];

/** True when the caller may create, rename, move or delete knowledge items. */
export function canEditKnowledge(req: NextApiRequestWithAuth): boolean {
  return KNOWLEDGE_EDITOR_ROLES.includes(req.user.role);
}

/**
 * Returns the caller's organization id, or answers 403 and returns null for
 * callers without one (platform admins, malformed tokens).
 */
export function requireOrganization(req: NextApiRequestWithAuth, res: NextApiResponse): string | null {
  const { organizationId } = req.user;
  if (!organizationId || !mongoose.isValidObjectId(organizationId)) {
    res.status(403).json({ error: 'A workspace organization is required to use the knowledge base.' });
    return null;
  }
  return organizationId;
}

/** Validates a client-supplied id; answers 400 and returns null when invalid. */
export function parseObjectId(value: unknown, res: NextApiResponse, field = 'id'): mongoose.Types.ObjectId | null {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    res.status(400).json({ error: `A valid ${field} is required.` });
    return null;
  }
  return new mongoose.Types.ObjectId(value);
}
