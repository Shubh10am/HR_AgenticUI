import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import Employee from '@/models/Employee';
import Admin from '@/models/Admin';

const RECENT_LIMIT = 10;
const WINDOW_DAYS = 30;

export interface ActivityItem {
  id: string;
  action: string;
  category: string;
  outcome: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  /** First time this IP + browser was seen for the person within the retention window. */
  isNewDevice: boolean;
}

export interface ProfileOverview {
  joinedAt: string | null;
  lastSignIn: { at: string; ipAddress: string; userAgent: string } | null;
  recent: ActivityItem[];
  stats: {
    windowDays: number;
    actions: number;
    signIns: number;
    failedSignIns: number;
    devices: number;
    byCategory: { category: string; count: number }[];
  };
}

/**
 * The signed-in person's own account history, from the audit log. Only their
 * own entries are read, whatever their role.
 */
export async function getProfileOverview(userId: string): Promise<ProfileOverview> {
  await dbConnect();
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const mine = { actorId: userId };

  const account = mongoose.Types.ObjectId.isValid(userId)
    ? (await Employee.findById(userId).select('createdAt').lean()) ?? (await Admin.findById(userId).select('createdAt').lean())
    : null;

  const [recent, signIns, windowAgg, firstSeen] = await Promise.all([
    AuditLog.find(mine).sort({ createdAt: -1 }).limit(RECENT_LIMIT).lean(),
    // The newest sign-in is this session; the one before it is "last sign-in".
    AuditLog.find({ ...mine, action: 'Signed in', outcome: 'success' }).sort({ createdAt: -1 }).limit(2).lean(),
    AuditLog.aggregate([
      { $match: { ...mine, createdAt: { $gte: since } } },
      {
        $facet: {
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          signIns: [{ $match: { action: 'Signed in' } }, { $group: { _id: '$outcome', count: { $sum: 1 } } }],
          devices: [{ $group: { _id: { ip: '$ipAddress', ua: '$userAgent' } } }, { $count: 'count' }],
          total: [{ $count: 'count' }],
        },
      },
    ]),
    AuditLog.aggregate([
      { $match: mine },
      { $group: { _id: { ip: '$ipAddress', ua: '$userAgent' }, first: { $min: '$createdAt' } } },
    ]),
  ]);

  const firstSeenAt = new Map(firstSeen.map((row) => [`${row._id.ip}|${row._id.ua}`, new Date(row.first).getTime()]));
  const facets = windowAgg[0] ?? {};
  const signInCount = (outcome: string) => facets.signIns?.find((row: { _id: string }) => row._id === outcome)?.count ?? 0;
  const previous = signIns[1] ?? signIns[0];

  return {
    joinedAt: account?.createdAt ? new Date(account.createdAt).toISOString() : null,
    lastSignIn: previous ? { at: new Date(previous.createdAt).toISOString(), ipAddress: previous.ipAddress, userAgent: previous.userAgent } : null,
    recent: recent.map((entry) => ({
      id: String(entry._id),
      action: entry.action,
      category: entry.category,
      outcome: entry.outcome,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      createdAt: new Date(entry.createdAt).toISOString(),
      isNewDevice: entry.action === 'Signed in' && firstSeenAt.get(`${entry.ipAddress}|${entry.userAgent}`) === new Date(entry.createdAt).getTime() && firstSeen.length > 1,
    })),
    stats: {
      windowDays: WINDOW_DAYS,
      actions: facets.total?.[0]?.count ?? 0,
      signIns: signInCount('success'),
      failedSignIns: signInCount('failure'),
      devices: facets.devices?.[0]?.count ?? 0,
      byCategory: (facets.byCategory ?? []).map((row: { _id: string; count: number }) => ({ category: row._id, count: row.count })),
    },
  };
}
