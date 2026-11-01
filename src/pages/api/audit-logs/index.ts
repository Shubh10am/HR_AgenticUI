import type { NextApiResponse } from 'next';
import mongoose, { type FilterQuery } from 'mongoose';
import AuditLog, { AUDIT_RETENTION_DAYS, type IAuditLog } from '@/models/AuditLog';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';

/** Roles that see the whole organization's activity; everyone else sees only their own. */
const ORG_WIDE_ROLES = ['Admin', 'SuperAdmin'];
const MAX_PAGE_SIZE = 100;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? '').trim();
}

async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id, role, organizationId } = req.user;
  const isOrgWide = ORG_WIDE_ROLES.includes(role);

  // Scope always comes from the verified token, never from the query string.
  const filter: FilterQuery<IAuditLog> = {};
  if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
    filter.organizationId = new mongoose.Types.ObjectId(organizationId);
  } else {
    filter.organizationId = null;
  }
  if (!isOrgWide) filter.actorId = id;

  const search = single(req.query.q);
  if (search) {
    const pattern = new RegExp(escapeRegex(search.slice(0, 100)), 'i');
    filter.$or = [{ actorName: pattern }, { actorEmail: pattern }, { action: pattern }, { ipAddress: pattern }];
  }

  const category = single(req.query.category);
  if (category) filter.category = category;

  const outcome = single(req.query.outcome);
  if (outcome === 'success' || outcome === 'failure') filter.outcome = outcome;

  const from = new Date(single(req.query.from));
  const to = new Date(single(req.query.to));
  if (!Number.isNaN(from.getTime()) || !Number.isNaN(to.getTime())) {
    filter.createdAt = {};
    if (!Number.isNaN(from.getTime())) filter.createdAt.$gte = from;
    if (!Number.isNaN(to.getTime())) filter.createdAt.$lte = to;
  }

  const page = Math.max(1, parseInt(single(req.query.page), 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(single(req.query.limit), 10) || 25));

  try {
    const scopeFilter = { organizationId: filter.organizationId, ...(isOrgWide ? {} : { actorId: id }) };
    const [entries, total, categories] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(filter),
      AuditLog.distinct('category', scopeFilter),
    ]);

    return res.status(200).json({
      entries: entries.map((entry) => ({ ...entry, _id: String(entry._id), organizationId: undefined })),
      total,
      page,
      limit,
      categories: (categories as string[]).sort(),
      scope: isOrgWide ? 'organization' : 'self',
      retentionDays: AUDIT_RETENTION_DAYS,
    });
  } catch (error) {
    console.error('[audit] Failed to list audit entries:', error);
    return res.status(500).json({ error: 'Could not load the audit log.' });
  }
}

export default withAuth(handler);
