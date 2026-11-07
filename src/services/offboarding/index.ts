import mongoose from 'mongoose';
import Offboarding, { type IOffboarding } from '@/models/Offboarding';
import Employee from '@/models/Employee';
import Asset from '@/models/Asset';
import { ApiError, isPeopleTeam, type Viewer } from '@/lib/api-route';
import { approvalsForSubjects, cancelApproval, startApproval } from '@/services/approvals';
import {
  CHECKLIST_TEMPLATE,
  DEFAULT_NOTICE_DAYS,
  EXIT_QUESTIONS,
  EXIT_REASONS,
  type ChecklistOwner,
  type OffboardingView,
} from '@/lib/offboarding';

const OPEN = ['pending-approval', 'in-progress'];

const freshChecklist = () => CHECKLIST_TEMPLATE.map((item) => ({ ...item, done: false, doneBy: null, doneAt: null }));

/** Who may tick an item: its owner group, with HR and admins able to tick anything. */
function canTick(viewer: Viewer, owner: ChecklistOwner, employeeId: string, managerId: string | null) {
  if (isPeopleTeam(viewer.role)) return true;
  if (owner === 'Employee') return viewer.id === employeeId;
  if (owner === 'Manager') return viewer.id === managerId;
  return false;
}

async function toViews(viewer: Viewer, cases: any[]): Promise<OffboardingView[]> {
  const ids = new Set<string>();
  for (const item of cases) {
    ids.add(String(item.employee));
    for (const step of item.checklist ?? []) if (step.doneBy) ids.add(String(step.doneBy));
  }
  const people = await Employee.find({ _id: { $in: [...ids] } }).select('name department jobTitle managerId').lean();
  const byId = new Map(people.map((person) => [String(person._id), person]));
  const approvals = await approvalsForSubjects(viewer, cases.map((item) => String(item._id)));
  const seesInterview = isPeopleTeam(viewer.role);
  const appAccess = await (await import('@/services/apps')).accessHeldBy(cases.map((item) => item.employee));
  const held = await Asset.find({ assignee: { $in: cases.map((item) => item.employee) } }).select('tag name category assignee').lean();

  return cases.map((item) => {
    const person = byId.get(String(item.employee));
    const managerId = person?.managerId ? String(person.managerId) : null;
    const checklist = (item.checklist ?? []).map((step: any) => ({
      key: step.key,
      label: step.label,
      owner: step.owner,
      done: !!step.done,
      doneByName: step.doneBy ? byId.get(String(step.doneBy))?.name ?? 'Former colleague' : null,
      doneAt: step.doneAt ? new Date(step.doneAt).toISOString() : null,
      canTick: item.status === 'in-progress' && canTick(viewer, step.owner, String(item.employee), managerId),
    }));
    const done = checklist.filter((step: { done: boolean }) => step.done).length;
    return {
      id: String(item._id),
      employee: { id: String(item.employee), name: person?.name ?? 'Former colleague', department: person?.department ?? '', jobTitle: person?.jobTitle ?? '' },
      reason: item.reason,
      note: item.note ?? '',
      noticeGivenOn: new Date(item.noticeGivenOn).toISOString(),
      lastWorkingDay: new Date(item.lastWorkingDay).toISOString(),
      status: item.status,
      checklist,
      progress: checklist.length ? Math.round((done / checklist.length) * 100) : 0,
      exitInterviewSubmitted: !!item.exitInterview?.submittedAt || checklist.some((step: { key: string; done: boolean }) => step.key === 'exit-interview' && step.done),
      exitInterview:
        seesInterview && item.exitInterview?.answers
          ? EXIT_QUESTIONS.map((question) => ({ key: question.key, label: question.label, answer: item.exitInterview.answers.find((a: any) => a.key === question.key)?.answer ?? '' }))
          : null,
      approval: approvals.get(String(item._id)) ?? null,
      assets: held.filter((asset) => String(asset.assignee) === String(item.employee)).map((asset) => ({ tag: asset.tag, name: asset.name, category: asset.category })),
      apps: appAccess.filter((a) => a.employee.id === String(item.employee)).map((a) => ({ name: a.app.name, status: a.status === 'to-revoke' ? 'Being removed' : 'Active' })),
      mine: String(item.employee) === viewer.id,
      createdAt: new Date(item.createdAt).toISOString(),
    };
  });
}

/**
 * Lists exits the viewer can see: their own, their direct reports' (managers), or everyone's (HR and admins).
 */
export async function listOffboarding(viewer: Viewer): Promise<OffboardingView[]> {
  let filter: Record<string, unknown>;
  if (isPeopleTeam(viewer.role)) filter = { organizationId: viewer.organizationId };
  else {
    const reports = await Employee.find({ organizationId: viewer.organizationId, managerId: viewer.id }).distinct('_id');
    filter = { organizationId: viewer.organizationId, employee: { $in: [viewer.id, ...reports] } };
  }
  const cases = await Offboarding.find(filter).select('+exitInterview').sort({ createdAt: -1 }).limit(300).lean();
  return toViews(viewer, cases);
}

const dateOf = (value: unknown, label: string) => {
  const date = new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) throw new ApiError(`Choose the ${label}.`);
  return date;
};

/**
 * Starts an exit. Someone resigning starts their own, which goes for approval;
 * HR and admins can start one for a colleague, which begins straight away.
 */
export async function startOffboarding(viewer: Viewer, input: Record<string, unknown>): Promise<OffboardingView> {
  const employeeId = typeof input.employeeId === 'string' && input.employeeId ? input.employeeId : viewer.id;
  const forSelf = employeeId === viewer.id;
  if (!forSelf && !isPeopleTeam(viewer.role)) throw new ApiError('Only HR and admins can start an exit for someone else.', 403);
  if (!mongoose.isValidObjectId(employeeId)) throw new ApiError('Unknown person.');
  const person = await Employee.findOne({ _id: employeeId, organizationId: viewer.organizationId }).select('name').lean();
  if (!person) throw new ApiError('That person is not in your organisation.');
  if (await Offboarding.exists({ employee: employeeId, status: { $in: OPEN } })) throw new ApiError(forSelf ? 'You already have an open resignation.' : `${person.name} already has an open exit.`);

  const reason = String(input.reason ?? 'Resignation');
  if (!(EXIT_REASONS as readonly string[]).includes(reason)) throw new ApiError('Choose a reason.');
  const noticeGivenOn = input.noticeGivenOn ? dateOf(input.noticeGivenOn, 'notice date') : new Date();
  const lastWorkingDay = input.lastWorkingDay ? dateOf(input.lastWorkingDay, 'last working day') : new Date(noticeGivenOn.getTime() + DEFAULT_NOTICE_DAYS * 86_400_000);
  if (lastWorkingDay < noticeGivenOn) throw new ApiError('The last working day must be after the notice date.');

  const item = await Offboarding.create({
    organizationId: viewer.organizationId,
    employee: employeeId,
    initiatedBy: viewer.id,
    reason,
    note: String(input.note ?? '').trim().slice(0, 1000),
    noticeGivenOn,
    lastWorkingDay,
    status: forSelf ? 'pending-approval' : 'in-progress',
    checklist: freshChecklist(),
  });
  if (forSelf) {
    await startApproval({
      viewer,
      kind: 'offboarding',
      subjectId: item._id as mongoose.Types.ObjectId,
      title: `${person.name} · ${reason}`,
      summary: `Last working day ${lastWorkingDay.toISOString().slice(0, 10)}`,
    });
  }
  return (await toViews(viewer, [(await Offboarding.findById(item._id).lean())!]))[0];
}

/** Called by the approval engine when a resignation is accepted or not. */
export async function onOffboardingSettled(id: string, outcome: 'approved' | 'rejected' | 'cancelled') {
  const status = outcome === 'approved' ? 'in-progress' : outcome === 'rejected' ? 'rejected' : 'withdrawn';
  await Offboarding.updateOne({ _id: id, status: 'pending-approval' }, { $set: { status } });
}

async function loadCase(viewer: Viewer, id: unknown): Promise<{ item: IOffboarding; managerId: string | null }> {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown exit.');
  const item = await Offboarding.findOne({ _id: id, organizationId: viewer.organizationId }).select('+exitInterview');
  if (!item) throw new ApiError('Exit not found.', 404);
  const person = await Employee.findById(item.employee).select('managerId').lean();
  const managerId = person?.managerId ? String(person.managerId) : null;
  const allowed = isPeopleTeam(viewer.role) || String(item.employee) === viewer.id || managerId === viewer.id;
  if (!allowed) throw new ApiError('Exit not found.', 404);
  return { item, managerId };
}

async function viewOf(viewer: Viewer, id: string) {
  return (await toViews(viewer, [(await Offboarding.findById(id).select('+exitInterview').lean())!]))[0];
}

/** Ticks or unticks a checklist item; the exit completes when every item is done. */
export async function setChecklistItem(viewer: Viewer, id: unknown, key: unknown, done: unknown): Promise<OffboardingView> {
  const { item, managerId } = await loadCase(viewer, id);
  if (item.status !== 'in-progress') throw new ApiError('This exit is not in progress.');
  const step = item.checklist.find((candidate) => candidate.key === key);
  if (!step) throw new ApiError('Unknown checklist item.');
  if (!canTick(viewer, step.owner, String(item.employee), managerId)) throw new ApiError(`Only ${step.owner === 'Manager' ? 'the manager' : step.owner} can complete this item.`, 403);
  step.done = !!done;
  step.doneBy = done ? new mongoose.Types.ObjectId(viewer.id) : null;
  step.doneAt = done ? new Date() : null;
  if (item.checklist.every((candidate) => candidate.done)) item.status = 'completed';
  item.markModified('checklist');
  await item.save();
  return viewOf(viewer, String(item._id));
}

/** The leaver's confidential exit feedback. Ticks the checklist item. */
export async function submitExitInterview(viewer: Viewer, id: unknown, answers: unknown): Promise<OffboardingView> {
  const { item } = await loadCase(viewer, id);
  if (String(item.employee) !== viewer.id) throw new ApiError('Only the person leaving can share exit feedback.', 403);
  if (!OPEN.includes(item.status)) throw new ApiError('This exit is closed.');
  const given = (answers ?? {}) as Record<string, unknown>;
  const clean = EXIT_QUESTIONS.map((question) => ({ key: question.key, answer: String(given[question.key] ?? '').trim().slice(0, 2000) }));
  if (!clean.some((answer) => answer.answer)) throw new ApiError('Answer at least one question.');
  item.exitInterview = { answers: clean, submittedAt: new Date() };
  const step = item.checklist.find((candidate) => candidate.key === 'exit-interview');
  if (step) Object.assign(step, { done: true, doneBy: new mongoose.Types.ObjectId(viewer.id), doneAt: new Date() });
  if (item.status === 'in-progress' && item.checklist.every((candidate) => candidate.done)) item.status = 'completed';
  item.markModified('checklist');
  await item.save();
  return viewOf(viewer, String(item._id));
}

/** Withdraws a resignation before it completes (the leaver, or HR and admins). */
export async function withdrawOffboarding(viewer: Viewer, id: unknown): Promise<OffboardingView> {
  const { item } = await loadCase(viewer, id);
  if (String(item.employee) !== viewer.id && !isPeopleTeam(viewer.role)) throw new ApiError('Only the person leaving, HR or admins can withdraw this.', 403);
  if (!OPEN.includes(item.status)) throw new ApiError('This exit is already closed.');
  item.status = 'withdrawn';
  await item.save();
  if (String(item.employee) === viewer.id) await cancelApproval(viewer, String(item._id));
  return viewOf(viewer, String(item._id));
}

/** Moves the last working day (HR and admins, or the manager). */
export async function updateLastDay(viewer: Viewer, id: unknown, lastWorkingDay: unknown): Promise<OffboardingView> {
  const { item, managerId } = await loadCase(viewer, id);
  if (!isPeopleTeam(viewer.role) && managerId !== viewer.id) throw new ApiError('Only the manager, HR or admins can change the last day.', 403);
  const date = dateOf(lastWorkingDay, 'last working day');
  if (date < item.noticeGivenOn) throw new ApiError('The last working day must be after the notice date.');
  item.lastWorkingDay = date;
  await item.save();
  return viewOf(viewer, String(item._id));
}
