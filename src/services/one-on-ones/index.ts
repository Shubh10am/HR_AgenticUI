import mongoose from 'mongoose';
import OneOnOne, { type IOneOnOne } from '@/models/OneOnOne';
import Employee from '@/models/Employee';
import { ApiError, type Viewer } from '@/lib/api-route';
import type { OneOnOneOverview, OneOnOneView } from '@/lib/one-on-ones';

const oid = (id: string) => new mongoose.Types.ObjectId(id);
const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

/** Turns a meeting into what this viewer may see: their own private notes only. */
async function toViews(viewer: Viewer, meetings: any[]): Promise<OneOnOneView[]> {
  const ids = new Set<string>();
  for (const meeting of meetings) {
    ids.add(String(meeting.manager));
    ids.add(String(meeting.report));
    meeting.agenda?.forEach((item: any) => ids.add(String(item.addedBy)));
    meeting.actions?.forEach((item: any) => ids.add(String(item.owner)));
  }
  const people = new Map((await Employee.find({ _id: { $in: [...ids] } }).select('name jobTitle').lean()).map((p) => [String(p._id), p]));
  const nameOf = (id: unknown) => people.get(String(id))?.name ?? 'Former colleague';
  return meetings.map((meeting) => {
    const iAmManager = String(meeting.manager) === viewer.id;
    const other = iAmManager ? meeting.report : meeting.manager;
    return {
      id: String(meeting._id),
      manager: { id: String(meeting.manager), name: nameOf(meeting.manager) },
      report: { id: String(meeting.report), name: nameOf(meeting.report), jobTitle: people.get(String(meeting.report))?.jobTitle ?? '' },
      withPerson: { id: String(other), name: nameOf(other) },
      iAmManager,
      scheduledFor: new Date(meeting.scheduledFor).toISOString(),
      status: meeting.status,
      agenda: (meeting.agenda ?? []).map((item: any) => ({ id: String(item._id), text: item.text, addedByName: nameOf(item.addedBy), done: !!item.done })),
      sharedNotes: meeting.sharedNotes ?? '',
      myPrivateNotes: (iAmManager ? meeting.managerNotes : meeting.reportNotes) ?? '',
      actions: (meeting.actions ?? []).map((item: any) => ({ id: String(item._id), text: item.text, ownerId: String(item.owner), ownerName: nameOf(item.owner), done: !!item.done })),
    };
  });
}

/** Meetings the viewer is in (as manager or report), newest upcoming first, and who they can book with. */
export async function oneOnOneOverview(viewer: Viewer): Promise<OneOnOneOverview> {
  const me = await Employee.findById(viewer.id).select('managerId').lean();
  const [meetings, reports, manager] = await Promise.all([
    OneOnOne.find({ organizationId: viewer.organizationId, $or: [{ manager: viewer.id }, { report: viewer.id }] }).select('+managerNotes +reportNotes').sort({ scheduledFor: -1 }).limit(200).lean(),
    Employee.find({ organizationId: viewer.organizationId, managerId: viewer.id }).select('name').sort({ name: 1 }).lean(),
    me?.managerId ? Employee.findById(me.managerId).select('name').lean() : null,
  ]);
  return {
    meetings: await toViews(viewer, meetings),
    people: [...(manager ? [{ id: String(manager._id), name: manager.name, relation: 'manager' as const }] : []), ...reports.map((p) => ({ id: String(p._id), name: p.name, relation: 'report' as const }))],
  };
}

/** Books a 1:1 between the viewer and their manager or one of their reports. */
export async function scheduleOneOnOne(viewer: Viewer, input: Record<string, unknown>) {
  const withId = String(input.withId ?? '');
  if (!mongoose.isValidObjectId(withId)) throw new ApiError('Choose who the 1:1 is with.');
  const when = new Date(String(input.scheduledFor ?? ''));
  if (Number.isNaN(when.getTime())) throw new ApiError('Choose a date and time.');
  if (when.getTime() < Date.now() - 3_600_000) throw new ApiError('Pick a time that hasn’t passed.');
  const [me, other] = await Promise.all([
    Employee.findById(viewer.id).select('managerId').lean(),
    Employee.findOne({ _id: withId, organizationId: viewer.organizationId }).select('managerId').lean(),
  ]);
  if (!other) throw new ApiError('That person is not in your organisation.');
  let manager: string, report: string;
  if (String(other.managerId) === viewer.id) [manager, report] = [viewer.id, withId];
  else if (me?.managerId && String(me.managerId) === withId) [manager, report] = [withId, viewer.id];
  else throw new ApiError('1:1s are between a manager and their direct report.', 403);
  // Carry over unfinished action items from the last meeting, so nothing gets lost.
  const last = await OneOnOne.findOne({ manager, report, status: 'completed' }).sort({ scheduledFor: -1 }).lean();
  const carried = (last?.actions ?? []).filter((item) => !item.done).map((item) => ({ text: item.text, owner: item.owner, done: false }));
  const agenda = text(input.firstItem, 200) ? [{ text: text(input.firstItem, 200), addedBy: oid(viewer.id), done: false }] : [];
  const meeting = await OneOnOne.create({ organizationId: viewer.organizationId, manager, report, scheduledFor: when, agenda, actions: carried });
  return (await toViews(viewer, [meeting.toObject()]))[0];
}

async function loadMine(viewer: Viewer, id: unknown): Promise<IOneOnOne> {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown 1:1.');
  const meeting = await OneOnOne.findOne({ _id: id, organizationId: viewer.organizationId, $or: [{ manager: viewer.id }, { report: viewer.id }] }).select('+managerNotes +reportNotes');
  if (!meeting) throw new ApiError('1:1 not found.', 404);
  return meeting;
}

/**
 * One change to a meeting. Either person can edit the agenda, shared notes and actions;
 * private notes are written to the viewer's own side only.
 */
export async function updateOneOnOne(viewer: Viewer, id: unknown, input: Record<string, unknown>) {
  const meeting = await loadMine(viewer, id);
  const iAmManager = String(meeting.manager) === viewer.id;
  const op = input.op;
  const itemId = String(input.itemId ?? '');
  const locked = meeting.status === 'cancelled';
  if (locked && op !== 'reopen') throw new ApiError('This 1:1 was cancelled.');
  switch (op) {
    case 'add-agenda': {
      const value = text(input.text, 200);
      if (!value) throw new ApiError('Write the agenda item.');
      if (meeting.agenda.length >= 30) throw new ApiError('That’s a long agenda — keep it to 30 items.');
      meeting.agenda.push({ text: value, addedBy: oid(viewer.id), done: false } as any);
      break;
    }
    case 'toggle-agenda': {
      const item = meeting.agenda.find((entry) => String(entry._id) === itemId);
      if (!item) throw new ApiError('Agenda item not found.');
      item.done = !item.done;
      break;
    }
    case 'remove-agenda':
      meeting.agenda = meeting.agenda.filter((entry) => String(entry._id) !== itemId) as any;
      break;
    case 'notes':
      if (input.sharedNotes !== undefined) meeting.sharedNotes = text(input.sharedNotes, 5000);
      if (input.privateNotes !== undefined) meeting[iAmManager ? 'managerNotes' : 'reportNotes'] = text(input.privateNotes, 5000);
      break;
    case 'add-action': {
      const value = text(input.text, 200);
      const owner = String(input.ownerId ?? viewer.id);
      if (!value) throw new ApiError('Write the action item.');
      if (owner !== String(meeting.manager) && owner !== String(meeting.report)) throw new ApiError('Actions belong to someone in the 1:1.');
      meeting.actions.push({ text: value, owner: oid(owner), done: false } as any);
      break;
    }
    case 'toggle-action': {
      const item = meeting.actions.find((entry) => String(entry._id) === itemId);
      if (!item) throw new ApiError('Action not found.');
      item.done = !item.done;
      break;
    }
    case 'remove-action':
      meeting.actions = meeting.actions.filter((entry) => String(entry._id) !== itemId) as any;
      break;
    case 'complete':
      meeting.status = 'completed';
      break;
    case 'cancel':
      meeting.status = 'cancelled';
      break;
    case 'reopen':
      meeting.status = 'scheduled';
      break;
    case 'reschedule': {
      const when = new Date(String(input.scheduledFor ?? ''));
      if (Number.isNaN(when.getTime())) throw new ApiError('Choose a date and time.');
      meeting.scheduledFor = when;
      meeting.status = 'scheduled';
      break;
    }
    default:
      throw new ApiError('Unknown change.');
  }
  await meeting.save();
  return (await toViews(viewer, [meeting.toObject()]))[0];
}
