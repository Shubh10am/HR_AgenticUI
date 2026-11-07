import mongoose from 'mongoose';
import RewardItem from '@/models/RewardItem';
import RewardTxn from '@/models/RewardTxn';
import Employee from '@/models/Employee';
import { ApiError, isPeopleTeam, requireRole, type Viewer } from '@/lib/api-route';
import {
  KUDOS_POINTS,
  KUDOS_POINTS_PER_GIVER_MONTHLY,
  MAX_AWARD,
  type RedemptionView,
  type RewardItemView,
  type RewardsOverview,
  type RewardTxnView,
} from '@/lib/rewards';

const PEOPLE = ['Admin', 'HR'];
const oid = (id: string) => new mongoose.Types.ObjectId(id);
const monthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const itemView = (item: any): RewardItemView => ({ id: String(item._id), name: item.name, description: item.description ?? '', cost: item.cost, stock: item.stock ?? null, active: !!item.active });
const txnView = (txn: any): RewardTxnView => ({ id: String(txn._id), kind: txn.kind, points: txn.points, reason: txn.reason ?? '', status: txn.status ?? null, itemName: txn.itemName ?? null, at: new Date(txn.createdAt).toISOString() });

async function balanceOf(employeeId: string) {
  const [row] = await RewardTxn.aggregate([{ $match: { employee: oid(employeeId) } }, { $group: { _id: null, total: { $sum: '$points' } } }]);
  return row?.total ?? 0;
}

/**
 * Pays the recipient for a kudos post. A giver's first few kudos each month earn points;
 * later ones still post but pay nothing, so points can't be farmed between friends.
 */
export async function awardKudosPoints(viewer: Viewer, recipientId: string, postId: string) {
  const given = await RewardTxn.countDocuments({ by: viewer.id, kind: 'kudos', createdAt: { $gte: monthStart() } });
  if (given >= KUDOS_POINTS_PER_GIVER_MONTHLY) return;
  await RewardTxn.create({ organizationId: viewer.organizationId, employee: recipientId, kind: 'kudos', points: KUDOS_POINTS, reason: `Kudos from ${viewer.name || 'a colleague'}`, by: viewer.id, post: postId }).catch(() => undefined);
}

/** The viewer's balance, history, the reward catalogue and this month's top earners. */
export async function rewardsOverview(viewer: Viewer): Promise<RewardsOverview> {
  const [balance, history, items, earned, leaders] = await Promise.all([
    balanceOf(viewer.id),
    RewardTxn.find({ employee: viewer.id }).sort({ createdAt: -1 }).limit(50).lean(),
    RewardItem.find({ organizationId: viewer.organizationId, ...(isPeopleTeam(viewer.role) ? {} : { active: true }) }).sort({ cost: 1 }).lean(),
    RewardTxn.aggregate([{ $match: { employee: oid(viewer.id), points: { $gt: 0 }, kind: { $ne: 'refund' }, createdAt: { $gte: monthStart() } } }, { $group: { _id: null, total: { $sum: '$points' } } }]),
    RewardTxn.aggregate([
      { $match: { organizationId: oid(viewer.organizationId), kind: { $in: ['kudos', 'award'] }, createdAt: { $gte: monthStart() } } },
      { $group: { _id: '$employee', points: { $sum: '$points' } } },
      { $sort: { points: -1 } },
      { $limit: 5 },
    ]),
  ]);
  const people = new Map((await Employee.find({ _id: { $in: leaders.map((row) => row._id) } }).select('name department').lean()).map((p) => [String(p._id), p]));
  return {
    balance,
    earnedThisMonth: earned[0]?.total ?? 0,
    history: history.map(txnView),
    items: items.map(itemView),
    leaders: leaders.filter((row) => people.has(String(row._id))).map((row) => {
      const person = people.get(String(row._id))!;
      return { person: { id: String(row._id), name: person.name, department: person.department ?? '' }, points: row.points };
    }),
  };
}

/** Adds or edits a catalogue item (HR and admins). */
export async function saveItem(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, PEOPLE, 'Only HR and admins manage the reward catalogue.');
  const name = String(input.name ?? '').trim().slice(0, 80);
  const cost = Math.round(Number(input.cost));
  if (!name) throw new ApiError('Name the reward.');
  if (!Number.isFinite(cost) || cost < 1 || cost > 100_000) throw new ApiError('Set a cost between 1 and 100,000 points.');
  const rawStock = input.stock;
  const stock = rawStock === null || rawStock === undefined || rawStock === '' ? null : Math.round(Number(rawStock));
  if (stock !== null && (!Number.isFinite(stock) || stock < 0)) throw new ApiError('Stock must be zero or more, or left empty for no limit.');
  const fields = { name, description: String(input.description ?? '').trim().slice(0, 300), cost, stock, active: input.active !== false };
  if (typeof input.id === 'string' && mongoose.isValidObjectId(input.id)) {
    const result = await RewardItem.updateOne({ _id: input.id, organizationId: viewer.organizationId }, { $set: fields });
    if (!result.matchedCount) throw new ApiError('Reward not found.', 404);
  } else await RewardItem.create({ organizationId: viewer.organizationId, ...fields });
  return rewardsOverview(viewer);
}

/** HR and admins give points for something worth recognising. Nobody can award themselves. */
export async function awardPoints(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, PEOPLE, 'Only HR and admins can award points.');
  const employeeId = String(input.employeeId ?? '');
  const points = Math.round(Number(input.points));
  const reason = String(input.reason ?? '').trim().slice(0, 200);
  if (!mongoose.isValidObjectId(employeeId)) throw new ApiError('Choose who to award.');
  if (employeeId === viewer.id) throw new ApiError('You can’t award points to yourself.');
  if (!Number.isFinite(points) || points < 1 || points > MAX_AWARD) throw new ApiError(`Award between 1 and ${MAX_AWARD} points.`);
  if (!reason) throw new ApiError('Say what the points are for.');
  if (!(await Employee.exists({ _id: employeeId, organizationId: viewer.organizationId }))) throw new ApiError('That person is not in your organisation.');
  await RewardTxn.create({ organizationId: viewer.organizationId, employee: employeeId, kind: 'award', points, reason, by: viewer.id });
  return { ok: true };
}

/** Spends points on a catalogue item. HR fulfils it later; a declined request is refunded. */
export async function redeem(viewer: Viewer, itemId: unknown) {
  if (typeof itemId !== 'string' || !mongoose.isValidObjectId(itemId)) throw new ApiError('Unknown reward.');
  const item = await RewardItem.findOne({ _id: itemId, organizationId: viewer.organizationId, active: true }).lean();
  if (!item) throw new ApiError('That reward is not available.', 404);
  if ((await balanceOf(viewer.id)) < item.cost) throw new ApiError('You don’t have enough points for this yet.');
  if (item.stock !== null) {
    const taken = await RewardItem.updateOne({ _id: item._id, stock: { $gt: 0 } }, { $inc: { stock: -1 } });
    if (!taken.modifiedCount) throw new ApiError('That reward is out of stock.');
  }
  await RewardTxn.create({ organizationId: viewer.organizationId, employee: viewer.id, kind: 'redeem', points: -item.cost, reason: `Redeemed ${item.name}`, by: viewer.id, item: item._id, itemName: item.name, status: 'requested' });
  return rewardsOverview(viewer);
}

/** Redemption requests for HR and admins to fulfil. */
export async function listRedemptions(viewer: Viewer): Promise<RedemptionView[]> {
  requireRole(viewer, PEOPLE, 'Only HR and admins fulfil rewards.');
  const rows = await RewardTxn.find({ organizationId: viewer.organizationId, kind: 'redeem' }).sort({ status: -1, createdAt: -1 }).limit(200).lean();
  const people = new Map((await Employee.find({ _id: { $in: rows.map((row) => row.employee) } }).select('name department').lean()).map((p) => [String(p._id), p]));
  return rows.map((row) => ({ ...txnView(row), employee: { id: String(row.employee), name: people.get(String(row.employee))?.name ?? 'Former colleague', department: people.get(String(row.employee))?.department ?? '' } }));
}

/** Marks a redemption fulfilled, or declines it and refunds the points and stock. */
export async function decideRedemption(viewer: Viewer, id: unknown, decision: unknown) {
  requireRole(viewer, PEOPLE, 'Only HR and admins fulfil rewards.');
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown request.');
  if (decision !== 'fulfilled' && decision !== 'declined') throw new ApiError('Choose fulfil or decline.');
  const row = await RewardTxn.findOneAndUpdate({ _id: id, organizationId: viewer.organizationId, kind: 'redeem', status: 'requested' }, { $set: { status: decision } }, { new: true });
  if (!row) throw new ApiError('That request has already been handled.', 409);
  if (decision === 'declined') {
    await RewardTxn.create({ organizationId: viewer.organizationId, employee: row.employee, kind: 'refund', points: -row.points, reason: `Refund: ${row.itemName ?? 'reward'}`, by: viewer.id, item: row.item });
    if (row.item) await RewardItem.updateOne({ _id: row.item, stock: { $ne: null } }, { $inc: { stock: 1 } });
  }
  return listRedemptions(viewer);
}
