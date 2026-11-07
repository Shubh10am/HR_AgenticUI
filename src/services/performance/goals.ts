import mongoose from 'mongoose';
import Goal, { type IGoal } from '@/models/Goal';
import Employee from '@/models/Employee';
import { ApiError, isPeopleTeam, type Viewer } from '@/lib/api-route';
import { GOAL_STATUS_META, progressOf, type GoalStatus, type GoalView } from '@/lib/performance';

/** Owners, their manager, HR and admins can edit a goal. */
async function canEdit(viewer: Viewer, ownerId: string, managers: Map<string, string | null>) {
  return ownerId === viewer.id || isPeopleTeam(viewer.role) || managers.get(ownerId) === viewer.id;
}

async function toViews(viewer: Viewer, goals: any[]): Promise<GoalView[]> {
  const people = await Employee.find({ _id: { $in: goals.map((goal) => goal.owner) } }).select('name department managerId').lean();
  const byId = new Map(people.map((person) => [String(person._id), person]));
  const managers = new Map(people.map((person) => [String(person._id), person.managerId ? String(person.managerId) : null]));
  const parentIds = goals.map((goal) => goal.parentId).filter(Boolean);
  const parents = new Map((await Goal.find({ _id: { $in: parentIds } }).select('title').lean()).map((goal) => [String(goal._id), goal.title]));

  return Promise.all(
    goals.map(async (goal) => {
      const keyResults = (goal.keyResults ?? []).map((kr: any) => ({
        id: String(kr._id),
        title: kr.title,
        start: kr.start,
        target: kr.target,
        current: kr.current,
        unit: kr.unit ?? '',
        progress: progressOf(kr),
      }));
      const progress = keyResults.length ? Math.round(keyResults.reduce((total: number, kr: { progress: number }) => total + kr.progress, 0) / keyResults.length) : goal.manualProgress ?? 0;
      const owner = byId.get(String(goal.owner));
      return {
        id: String(goal._id),
        owner: { id: String(goal.owner), name: owner?.name ?? 'Former colleague', department: owner?.department ?? '' },
        title: goal.title,
        description: goal.description ?? '',
        parentId: goal.parentId ? String(goal.parentId) : null,
        parentTitle: goal.parentId ? parents.get(String(goal.parentId)) ?? null : null,
        dueDate: goal.dueDate ? new Date(goal.dueDate).toISOString() : null,
        status: goal.status,
        progress: goal.status === 'done' ? 100 : progress,
        keyResults,
        canEdit: await canEdit(viewer, String(goal.owner), managers),
        updatedAt: new Date(goal.updatedAt).toISOString(),
      };
    })
  );
}

/** Every goal in the organisation: goals are open so people can see how their work connects. */
export async function listGoals(viewer: Viewer): Promise<GoalView[]> {
  const goals = await Goal.find({ organizationId: viewer.organizationId }).sort({ updatedAt: -1 }).limit(1000).lean();
  return toViews(viewer, goals);
}

function cleanKeyResults(input: unknown) {
  if (input === undefined) return undefined;
  if (!Array.isArray(input) || input.length > 6) throw new ApiError('A goal can have up to 6 key results.');
  return input.map((raw) => {
    const kr = raw as Record<string, unknown>;
    const title = String(kr.title ?? '').trim().slice(0, 140);
    const target = Number(kr.target);
    const start = Number(kr.start ?? 0);
    const current = Number(kr.current ?? start);
    if (!title) throw new ApiError('Each key result needs a title.');
    if (![target, start, current].every(Number.isFinite)) throw new ApiError('Key result values must be numbers.');
    return {
      ...(typeof kr.id === 'string' && mongoose.isValidObjectId(kr.id) ? { _id: kr.id } : {}),
      title,
      start,
      target,
      current,
      unit: String(kr.unit ?? '').trim().slice(0, 20),
    };
  });
}

async function validParent(viewer: Viewer, parentId: unknown, selfId?: string) {
  if (!parentId) return null;
  if (typeof parentId !== 'string' || !mongoose.isValidObjectId(parentId) || parentId === selfId) throw new ApiError('Choose a valid goal to support.');
  // Refuse a loop: the parent must not sit under this goal.
  let cursor: string | null = parentId;
  for (let hops = 0; cursor && hops < 20; hops++) {
    if (cursor === selfId) throw new ApiError('A goal cannot support one of its own sub-goals.');
    const parent: { parentId?: unknown } | null = await Goal.findOne({ _id: cursor, organizationId: viewer.organizationId }).select('parentId').lean();
    if (!parent) throw new ApiError('Choose a valid goal to support.');
    cursor = parent.parentId ? String(parent.parentId) : null;
  }
  return parentId;
}

/** Creates a goal for the viewer, or for a direct report (managers, HR and admins). */
export async function createGoal(viewer: Viewer, input: Record<string, unknown>): Promise<GoalView> {
  const ownerId = typeof input.ownerId === 'string' && input.ownerId ? input.ownerId : viewer.id;
  if (ownerId !== viewer.id) {
    const report = await Employee.exists({ _id: ownerId, organizationId: viewer.organizationId, ...(isPeopleTeam(viewer.role) ? {} : { managerId: viewer.id }) });
    if (!report) throw new ApiError('You can set goals for yourself or your direct reports.', 403);
  }
  const title = String(input.title ?? '').trim().slice(0, 140);
  if (!title) throw new ApiError('Give the goal a title.');
  const goal = await Goal.create({
    organizationId: viewer.organizationId,
    owner: ownerId,
    title,
    description: String(input.description ?? '').trim().slice(0, 1000),
    parentId: await validParent(viewer, input.parentId),
    dueDate: input.dueDate ? new Date(String(input.dueDate)) : null,
    keyResults: cleanKeyResults(input.keyResults) ?? [],
  });
  return (await toViews(viewer, [goal.toObject()]))[0];
}

async function editable(viewer: Viewer, id: unknown): Promise<IGoal> {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown goal.');
  const goal = await Goal.findOne({ _id: id, organizationId: viewer.organizationId });
  if (!goal) throw new ApiError('Goal not found.', 404);
  const owner = await Employee.findById(goal.owner).select('managerId').lean();
  const managers = new Map([[String(goal.owner), owner?.managerId ? String(owner.managerId) : null]]);
  if (!(await canEdit(viewer, String(goal.owner), managers))) throw new ApiError('Only the owner, their manager, HR or admins can change this goal.', 403);
  return goal;
}

/** Updates a goal's details, status, progress or key results. */
export async function updateGoal(viewer: Viewer, id: unknown, input: Record<string, unknown>): Promise<GoalView> {
  const goal = await editable(viewer, id);
  if (input.title !== undefined) {
    const title = String(input.title).trim().slice(0, 140);
    if (!title) throw new ApiError('Give the goal a title.');
    goal.title = title;
  }
  if (input.description !== undefined) goal.description = String(input.description).trim().slice(0, 1000);
  if (input.status !== undefined) {
    if (!(input.status as string in GOAL_STATUS_META)) throw new ApiError('Unknown status.');
    goal.status = input.status as GoalStatus;
  }
  if (input.manualProgress !== undefined) goal.manualProgress = Math.max(0, Math.min(100, Math.round(Number(input.manualProgress) || 0)));
  if (input.dueDate !== undefined) goal.dueDate = input.dueDate ? new Date(String(input.dueDate)) : null;
  if (input.parentId !== undefined) goal.parentId = (await validParent(viewer, input.parentId, String(goal._id))) as never;
  const keyResults = cleanKeyResults(input.keyResults);
  if (keyResults) goal.set('keyResults', keyResults);
  await goal.save();
  return (await toViews(viewer, [goal.toObject()]))[0];
}

/** Deletes a goal; goals that supported it are detached rather than deleted. */
export async function deleteGoal(viewer: Viewer, id: unknown) {
  const goal = await editable(viewer, id);
  await Goal.updateMany({ parentId: goal._id }, { $set: { parentId: null } });
  await goal.deleteOne();
  return { ok: true };
}
