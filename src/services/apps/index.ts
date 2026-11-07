import mongoose from 'mongoose';
import App from '@/models/App';
import AppAccess from '@/models/AppAccess';
import Employee from '@/models/Employee';
import { ApiError, isPeopleTeam, requireRole, type Viewer } from '@/lib/api-route';
import { cancelApproval, startApproval } from '@/services/approvals';
import { APP_CATEGORIES, type AccessStatus, type AccessView, type AppsOverview, type AppView } from '@/lib/apps';

const PEOPLE = ['Admin', 'HR'];
const OPEN: AccessStatus[] = ['pending-approval', 'to-grant', 'granted', 'to-revoke'];
const oid = (id: string) => new mongoose.Types.ObjectId(id);

const appView = (app: any): AppView => ({ id: String(app._id), name: app.name, url: app.url ?? '', category: app.category, description: app.description ?? '', defaultFor: app.defaultFor ?? [], requiresApproval: !!app.requiresApproval, active: !!app.active });

async function accessViews(rows: any[]): Promise<AccessView[]> {
  const apps = new Map((await App.find({ _id: { $in: rows.map((r) => r.app) } }).lean()).map((a) => [String(a._id), appView(a)]));
  const people = new Map((await Employee.find({ _id: { $in: rows.map((r) => r.employee) } }).select('name department').lean()).map((p) => [String(p._id), p]));
  return rows.filter((r) => apps.has(String(r.app))).map((r) => ({
    id: String(r._id),
    app: apps.get(String(r.app))!,
    employee: { id: String(r.employee), name: people.get(String(r.employee))?.name ?? 'Former colleague', department: people.get(String(r.employee))?.department ?? '' },
    status: r.status,
    reason: r.reason ?? '',
    source: r.source,
    updatedAt: new Date(r.updatedAt).toISOString(),
  }));
}

const move = (status: AccessStatus, by: string | null) => ({ $set: { status }, $push: { history: { status, by: by ? oid(by) : null, at: new Date() } } });

/** The catalogue, the viewer's own access, and (HR and admins) setup and removal tasks. */
export async function appsOverview(viewer: Viewer): Promise<AppsOverview> {
  const people = isPeopleTeam(viewer.role);
  const [catalogue, mine, queue] = await Promise.all([
    App.find({ organizationId: viewer.organizationId, ...(people ? {} : { active: true }) }).sort({ name: 1 }).lean(),
    AppAccess.find({ employee: viewer.id, status: { $ne: 'revoked' } }).sort({ updatedAt: -1 }).lean(),
    people ? AppAccess.find({ organizationId: viewer.organizationId, status: { $in: ['to-grant', 'to-revoke'] } }).sort({ updatedAt: 1 }).lean() : Promise.resolve(null),
  ]);
  return { catalogue: catalogue.map(appView), mine: await accessViews(mine), queue: queue ? await accessViews(queue) : null };
}

/** Adds or edits an app in the catalogue (HR and admins). */
export async function saveApp(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, PEOPLE, 'Only HR and admins manage the app catalogue.');
  const name = String(input.name ?? '').trim().slice(0, 60);
  if (!name) throw new ApiError('Name the app.');
  const url = String(input.url ?? '').trim().slice(0, 300);
  if (url && !/^https:\/\//i.test(url)) throw new ApiError('App links must start with https://');
  const category = String(input.category ?? 'Other');
  if (!(APP_CATEGORIES as readonly string[]).includes(category)) throw new ApiError('Choose a category.');
  const defaultFor = Array.isArray(input.defaultFor) ? [...new Set(input.defaultFor.map((d) => String(d).trim().slice(0, 60)).filter(Boolean))].slice(0, 20) : [];
  const fields = { name, url, category, description: String(input.description ?? '').trim().slice(0, 300), defaultFor, requiresApproval: input.requiresApproval !== false, active: input.active !== false };
  if (typeof input.id === 'string' && mongoose.isValidObjectId(input.id)) {
    const result = await App.updateOne({ _id: input.id, organizationId: viewer.organizationId }, { $set: fields });
    if (!result.matchedCount) throw new ApiError('App not found.', 404);
  } else await App.create({ organizationId: viewer.organizationId, ...fields });
  return appsOverview(viewer);
}

/** Asks for access to an app. Apps that need approval go to the manager; others go straight to setup. */
export async function requestAccess(viewer: Viewer, appId: unknown, reasonInput: unknown) {
  if (typeof appId !== 'string' || !mongoose.isValidObjectId(appId)) throw new ApiError('Choose an app.');
  const app = await App.findOne({ _id: appId, organizationId: viewer.organizationId, active: true }).lean();
  if (!app) throw new ApiError('That app is not available.', 404);
  if (await AppAccess.exists({ app: app._id, employee: viewer.id, status: { $in: OPEN } })) throw new ApiError('You already have or have asked for this app.');
  const reason = String(reasonInput ?? '').trim().slice(0, 300);
  if (app.requiresApproval && !reason) throw new ApiError('Say briefly why you need it.');
  const status: AccessStatus = app.requiresApproval ? 'pending-approval' : 'to-grant';
  const row = await AppAccess.create({ organizationId: viewer.organizationId, app: app._id, employee: viewer.id, status, reason, source: 'request', history: [{ status, by: viewer.id, at: new Date() }] });
  if (app.requiresApproval) await startApproval({ viewer, kind: 'app-access', subjectId: row._id as mongoose.Types.ObjectId, title: `${app.name} access`, summary: reason });
  return appsOverview(viewer);
}

/** Called by the approval engine. */
export async function onAccessSettled(id: string, outcome: 'approved' | 'rejected' | 'cancelled') {
  const next: AccessStatus = outcome === 'approved' ? 'to-grant' : outcome === 'rejected' ? 'rejected' : 'revoked';
  await AppAccess.updateOne({ _id: id, status: 'pending-approval' }, move(next, null));
}

/** Withdraws a pending request, or asks for your own access to be removed. */
export async function releaseAccess(viewer: Viewer, id: unknown) {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown access.');
  const row = await AppAccess.findOne({ _id: id, employee: viewer.id });
  if (!row) throw new ApiError('Access not found.', 404);
  if (row.status === 'pending-approval') {
    await AppAccess.updateOne({ _id: row._id }, move('revoked', viewer.id));
    await cancelApproval(viewer, String(row._id));
  } else if (row.status === 'to-grant') await AppAccess.updateOne({ _id: row._id }, move('revoked', viewer.id));
  else if (row.status === 'granted') await AppAccess.updateOne({ _id: row._id }, move('to-revoke', viewer.id));
  else throw new ApiError('Nothing to change.');
  return appsOverview(viewer);
}

/** HR and admins confirm a setup or removal is done in the app itself. */
export async function completeTask(viewer: Viewer, id: unknown) {
  requireRole(viewer, PEOPLE, 'Only HR and admins complete access tasks.');
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown task.');
  const row = await AppAccess.findOne({ _id: id, organizationId: viewer.organizationId, status: { $in: ['to-grant', 'to-revoke'] } });
  if (!row) throw new ApiError('That task is already done.', 409);
  await AppAccess.updateOne({ _id: row._id }, move(row.status === 'to-grant' ? 'granted' : 'revoked', viewer.id));
  return appsOverview(viewer);
}

/** Creates setup tasks for every default app a person should have (for new joiners). */
export async function provisionDefaults(viewer: Viewer, employeeId: unknown) {
  requireRole(viewer, PEOPLE, 'Only HR and admins set people up.');
  if (typeof employeeId !== 'string' || !mongoose.isValidObjectId(employeeId)) throw new ApiError('Choose a person.');
  const person = await Employee.findOne({ _id: employeeId, organizationId: viewer.organizationId }).select('department').lean();
  if (!person) throw new ApiError('That person is not in your organisation.');
  const apps = await App.find({ organizationId: viewer.organizationId, active: true, defaultFor: { $in: ['All', person.department ?? ''] } }).lean();
  const have = new Set((await AppAccess.find({ employee: employeeId, status: { $in: OPEN } }).distinct('app')).map(String));
  const fresh = apps.filter((a) => !have.has(String(a._id)));
  if (fresh.length) await AppAccess.insertMany(fresh.map((a) => ({ organizationId: viewer.organizationId, app: a._id, employee: employeeId, status: 'to-grant', source: 'joiner', history: [{ status: 'to-grant', by: viewer.id, at: new Date() }] })));
  return { added: fresh.length, ...(await appsOverview(viewer)) };
}

/** Creates removal tasks for everything a person has (for leavers). */
export async function revokeAll(viewer: Viewer, employeeId: unknown) {
  requireRole(viewer, PEOPLE, 'Only HR and admins remove access.');
  if (typeof employeeId !== 'string' || !mongoose.isValidObjectId(employeeId)) throw new ApiError('Choose a person.');
  if (!(await Employee.exists({ _id: employeeId, organizationId: viewer.organizationId }))) throw new ApiError('That person is not in your organisation.');
  const rows = await AppAccess.find({ employee: employeeId, status: { $in: OPEN } });
  for (const row of rows) {
    const next: AccessStatus = row.status === 'granted' || row.status === 'to-revoke' ? 'to-revoke' : 'revoked';
    await AppAccess.updateOne({ _id: row._id }, { ...move(next, viewer.id), $set: { status: next, source: next === 'to-revoke' ? 'exit' : row.source } });
    if (row.status === 'pending-approval') await (await import('@/models/ApprovalRequest')).default.updateOne({ subjectId: row._id, status: 'pending' }, { $set: { status: 'cancelled' } });
  }
  return { changed: rows.length, ...(await appsOverview(viewer)) };
}

/** What a person still has access to, for their exit page. */
export async function accessHeldBy(employeeIds: unknown[]) {
  const rows = await AppAccess.find({ employee: { $in: employeeIds }, status: { $in: ['granted', 'to-revoke'] } }).lean();
  return accessViews(rows);
}
