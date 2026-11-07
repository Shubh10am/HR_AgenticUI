import mongoose from 'mongoose';
import Asset, { type IAsset } from '@/models/Asset';
import Employee from '@/models/Employee';
import { ApiError, requireRole, type Viewer } from '@/lib/api-route';
import { ASSET_CATEGORIES, type AssetView } from '@/lib/assets';

const MANAGERS = ['Admin', 'HR'];

async function toViews(assets: any[]): Promise<AssetView[]> {
  const ids = new Set<string>();
  for (const asset of assets) {
    if (asset.assignee) ids.add(String(asset.assignee));
    for (const entry of asset.history ?? []) {
      if (entry.employee) ids.add(String(entry.employee));
      if (entry.by) ids.add(String(entry.by));
    }
  }
  const people = new Map((await Employee.find({ _id: { $in: [...ids] } }).select('name department').lean()).map((person) => [String(person._id), person]));
  const nameOf = (id: unknown) => (id ? people.get(String(id))?.name ?? 'Former colleague' : null);
  return assets.map((asset) => ({
    id: String(asset._id),
    tag: asset.tag,
    name: asset.name,
    category: asset.category,
    serial: asset.serial ?? '',
    purchasedOn: asset.purchasedOn ? new Date(asset.purchasedOn).toISOString() : null,
    status: asset.status,
    assignee: asset.assignee ? { id: String(asset.assignee), name: nameOf(asset.assignee)!, department: people.get(String(asset.assignee))?.department ?? '' } : null,
    assignedAt: asset.assignedAt ? new Date(asset.assignedAt).toISOString() : null,
    history: [...(asset.history ?? [])].reverse().map((entry: any) => ({ action: entry.action, employeeName: nameOf(entry.employee), byName: nameOf(entry.by), note: entry.note ?? '', at: new Date(entry.at).toISOString() })),
  }));
}

/** The whole register (HR and admins), or just the viewer's own equipment. */
export async function listAssets(viewer: Viewer, scope: unknown): Promise<AssetView[]> {
  const all = scope === 'all';
  if (all) requireRole(viewer, MANAGERS, 'Only HR and admins can see the asset register.');
  const assets = await Asset.find({ organizationId: viewer.organizationId, ...(all ? {} : { assignee: viewer.id }) }).sort({ tag: 1 }).lean();
  return toViews(assets);
}

/** Equipment a person holds, for the offboarding checklist. */
export async function assetsHeldBy(organizationId: string, employeeId: string) {
  return Asset.find({ organizationId, assignee: employeeId }).select('tag name category').lean();
}

/** Adds equipment to the register. */
export async function addAsset(viewer: Viewer, input: Record<string, unknown>): Promise<AssetView[]> {
  requireRole(viewer, MANAGERS, 'Only HR and admins manage assets.');
  const tag = String(input.tag ?? '').trim().toUpperCase().slice(0, 40);
  const name = String(input.name ?? '').trim().slice(0, 80);
  if (!tag || !name) throw new ApiError('Add an asset tag and a name.');
  if (!ASSET_CATEGORIES.includes(input.category as never)) throw new ApiError('Choose a category.');
  if (await Asset.exists({ organizationId: viewer.organizationId, tag })) throw new ApiError(`Tag ${tag} is already in use.`);
  await Asset.create({
    organizationId: viewer.organizationId,
    tag,
    name,
    category: input.category,
    serial: String(input.serial ?? '').trim().slice(0, 80),
    purchasedOn: input.purchasedOn ? new Date(String(input.purchasedOn)) : null,
    history: [{ action: 'added', by: viewer.id, at: new Date() }],
  });
  return listAssets(viewer, 'all');
}

async function load(viewer: Viewer, id: unknown): Promise<IAsset> {
  requireRole(viewer, MANAGERS, 'Only HR and admins manage assets.');
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown asset.');
  const asset = await Asset.findOne({ _id: id, organizationId: viewer.organizationId });
  if (!asset) throw new ApiError('Asset not found.', 404);
  return asset;
}

/**
 * Assigns, returns, sends for repair, retires or restocks equipment, keeping a history of each move.
 */
export async function moveAsset(viewer: Viewer, id: unknown, action: unknown, employeeId: unknown, note: unknown): Promise<AssetView[]> {
  const asset = await load(viewer, id);
  const text = typeof note === 'string' ? note.trim().slice(0, 300) : '';
  const entry = { by: new mongoose.Types.ObjectId(viewer.id), at: new Date(), note: text, employee: asset.assignee ?? null };
  if (action === 'assign') {
    if (asset.status !== 'available') throw new ApiError('Only equipment in stock can be assigned.');
    if (typeof employeeId !== 'string' || !(await Employee.exists({ _id: employeeId, organizationId: viewer.organizationId }))) throw new ApiError('Choose who gets it.');
    asset.status = 'assigned';
    asset.assignee = new mongoose.Types.ObjectId(employeeId);
    asset.assignedAt = new Date();
    asset.history.push({ ...entry, action: 'assigned', employee: asset.assignee });
  } else if (action === 'return') {
    if (asset.status !== 'assigned') throw new ApiError('This asset is not assigned.');
    asset.history.push({ ...entry, action: 'returned' });
    asset.status = 'available';
    asset.assignee = null;
    asset.assignedAt = null;
  } else if (action === 'repair' || action === 'retire') {
    if (asset.status === 'assigned') throw new ApiError('Mark it returned first.');
    asset.status = action === 'repair' ? 'repair' : 'retired';
    asset.history.push({ ...entry, action: action === 'repair' ? 'repair' : 'retired' });
  } else if (action === 'restock') {
    if (asset.status === 'assigned' || asset.status === 'available') throw new ApiError('This asset is already in use or in stock.');
    asset.status = 'available';
    asset.history.push({ ...entry, action: 'restocked' });
  } else throw new ApiError('Unknown action.');
  await asset.save();
  return listAssets(viewer, 'all');
}

