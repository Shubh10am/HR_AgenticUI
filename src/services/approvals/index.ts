import mongoose from 'mongoose';
import ApprovalPolicy from '@/models/ApprovalPolicy';
import ApprovalRequest, { type IApprovalRequest, type IApprovalStep } from '@/models/ApprovalRequest';
import Employee from '@/models/Employee';
import { ApiError, isPeopleTeam, type Viewer } from '@/lib/api-route';
import {
  APPROVAL_KINDS,
  APPROVER_LABEL,
  DEFAULT_POLICIES,
  type ApprovalKind,
  type ApprovalStatus,
  type ApprovalView,
  type PolicyStep,
} from '@/lib/approvals';

/** The steps an organisation uses for a kind of request, falling back to the defaults. */
export async function policyFor(organizationId: string, kind: ApprovalKind): Promise<PolicyStep[]> {
  const stored = await ApprovalPolicy.findOne({ organizationId, kind }).lean();
  return stored?.steps?.length ? stored.steps : DEFAULT_POLICIES[kind];
}

export async function listPolicies(viewer: Viewer) {
  const entries = await Promise.all(APPROVAL_KINDS.map(async (kind) => [kind, await policyFor(viewer.organizationId, kind)] as const));
  return Object.fromEntries(entries) as Record<ApprovalKind, PolicyStep[]>;
}

/** Replaces a kind's approval chain (Admin and HR). */
export async function savePolicy(viewer: Viewer, kind: unknown, steps: unknown): Promise<PolicyStep[]> {
  if (!isPeopleTeam(viewer.role)) throw new ApiError('Only HR and admins can change approval rules.', 403);
  if (!APPROVAL_KINDS.includes(kind as ApprovalKind)) throw new ApiError('Unknown request type.');
  if (!Array.isArray(steps) || steps.length === 0 || steps.length > 5) throw new ApiError('A chain needs between 1 and 5 steps.');
  const clean: PolicyStep[] = steps.map((step) => {
    const approver = (step as PolicyStep)?.approver;
    if (!['manager', 'HR', 'Admin'].includes(approver)) throw new ApiError('Each step needs an approver.');
    const raw = (step as PolicyStep).minAmount;
    const minAmount = raw === null || raw === undefined || (raw as unknown) === '' ? null : Number(raw);
    if (minAmount !== null && (!Number.isFinite(minAmount) || minAmount < 0)) throw new ApiError('Amount thresholds must be positive numbers.');
    return { approver, minAmount };
  });
  await ApprovalPolicy.updateOne(
    { organizationId: viewer.organizationId, kind },
    { $set: { steps: clean, updatedBy: viewer.id } },
    { upsert: true }
  );
  return clean;
}

/** Marks the next waiting step pending, skipping steps nobody can act on. Returns true when every step is done. */
function advance(request: IApprovalRequest): boolean {
  const next = request.steps.find((step) => step.status === 'waiting');
  if (!next) return true;
  next.status = 'pending';
  return false;
}

/**
 * Opens an approval for a record, following the organisation's chain for that kind.
 * A manager step is skipped when the requester has no manager; an amount threshold
 * skips a step for smaller requests. If every step is skipped the request is approved at once.
 *
 * @returns The new approval request.
 */
export async function startApproval(input: {
  viewer: Viewer;
  kind: ApprovalKind;
  subjectId: mongoose.Types.ObjectId | string;
  title: string;
  summary?: string;
  amount?: number | null;
  currency?: string | null;
}): Promise<IApprovalRequest> {
  const { viewer, kind } = input;
  const requester = await Employee.findById(viewer.id).select('managerId').lean();
  const steps: IApprovalStep[] = (await policyFor(viewer.organizationId, kind)).map((step) => {
    const belowThreshold = step.minAmount != null && (input.amount ?? 0) < step.minAmount;
    const noManager = step.approver === 'manager' && !requester?.managerId;
    return {
      approver: step.approver,
      assignee: step.approver === 'manager' ? (requester?.managerId as mongoose.Types.ObjectId | null) ?? null : null,
      status: belowThreshold || noManager ? 'skipped' : 'waiting',
    };
  });
  const request = new ApprovalRequest({
    organizationId: viewer.organizationId,
    kind,
    subjectId: input.subjectId,
    requester: viewer.id,
    title: input.title.slice(0, 140),
    summary: (input.summary ?? '').slice(0, 500),
    amount: input.amount ?? null,
    currency: input.currency ?? null,
    steps,
    status: 'pending',
  });
  if (advance(request)) request.status = 'approved';
  await request.save();
  if (request.status === 'approved') await settle(request);
  return request;
}

/** Whether the step is the viewer's own to decide (not counting an admin stepping in for a manager). */
const isAssigned = (viewer: Viewer, step: IApprovalStep | undefined, requesterId: string) => {
  if (!step || step.status !== 'pending' || requesterId === viewer.id) return false;
  if (step.approver === 'manager') return String(step.assignee) === viewer.id;
  if (step.approver === 'HR') return viewer.role === 'HR' || viewer.role === 'Admin';
  return viewer.role === 'Admin';
};

/** Whether the viewer may decide the step. Admins may also step in for an unavailable manager. */
const canAct = (viewer: Viewer, step: IApprovalStep | undefined, requesterId: string) => {
  if (!step || step.status !== 'pending') return false;
  if (requesterId === viewer.id) return false; // nobody approves their own request
  if (step.approver === 'manager') return String(step.assignee) === viewer.id || viewer.role === 'Admin';
  if (step.approver === 'HR') return viewer.role === 'HR' || viewer.role === 'Admin';
  return viewer.role === 'Admin';
};

/** Tells the owning module the outcome, so it can update its record. */
async function settle(request: IApprovalRequest) {
  const status = request.status as Exclude<ApprovalStatus, 'pending'>;
  if (request.kind === 'expense') (await import('@/services/expenses')).onExpenseSettled(String(request.subjectId), status);
  if (request.kind === 'offboarding') await (await import('@/services/offboarding')).onOffboardingSettled(String(request.subjectId), status);
  if (request.kind === 'leave') await (await import('@/services/leave')).onLeaveSettled(String(request.subjectId), status);
  if (request.kind === 'app-access') await (await import('@/services/apps')).onAccessSettled(String(request.subjectId), status);
  if (request.kind === 'timesheet') await (await import('@/services/timesheets')).onTimesheetSettled(String(request.subjectId), status);
}

/** Approves or rejects the current step. Rejection ends the request. */
export async function decide(viewer: Viewer, id: unknown, decision: unknown, comment: unknown): Promise<ApprovalView> {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown request.');
  if (decision !== 'approve' && decision !== 'reject') throw new ApiError('Choose approve or reject.');
  const request = await ApprovalRequest.findOne({ _id: id, organizationId: viewer.organizationId });
  if (!request) throw new ApiError('Request not found.', 404);
  const step = request.steps.find((candidate) => candidate.status === 'pending');
  if (!canAct(viewer, step, String(request.requester))) throw new ApiError('This request is not waiting on you.', 403);
  const note = typeof comment === 'string' ? comment.trim().slice(0, 500) : '';
  if (decision === 'reject' && !note) throw new ApiError('Add a short reason when rejecting.');

  step!.status = decision === 'approve' ? 'approved' : 'rejected';
  step!.decidedBy = new mongoose.Types.ObjectId(viewer.id);
  step!.decidedAt = new Date();
  step!.comment = note;
  if (decision === 'reject') request.status = 'rejected';
  else if (advance(request)) request.status = 'approved';
  request.markModified('steps');
  await request.save();
  if (request.status !== 'pending') await settle(request);
  return (await toViews(viewer, [request.toObject()]))[0];
}

/** Withdraws an open request (its requester only). Used when the record itself is withdrawn. */
export async function cancelApproval(viewer: Viewer, subjectId: string) {
  await ApprovalRequest.updateOne({ subjectId, requester: viewer.id, status: 'pending' }, { $set: { status: 'cancelled' } });
}

async function toViews(viewer: Viewer, requests: any[]): Promise<ApprovalView[]> {
  const ids = new Set<string>();
  for (const request of requests) {
    ids.add(String(request.requester));
    for (const step of request.steps) {
      if (step.assignee) ids.add(String(step.assignee));
      if (step.decidedBy) ids.add(String(step.decidedBy));
    }
  }
  const people = await Employee.find({ _id: { $in: [...ids] } }).select('name department').lean();
  const byId = new Map(people.map((person) => [String(person._id), person]));
  const nameOf = (id: unknown) => (id ? byId.get(String(id))?.name ?? 'Former colleague' : null);

  return requests.map((request) => ({
    id: String(request._id),
    kind: request.kind,
    title: request.title,
    summary: request.summary ?? '',
    amount: request.amount ?? null,
    currency: request.currency ?? null,
    requester: { id: String(request.requester), name: nameOf(request.requester) ?? '', department: byId.get(String(request.requester))?.department ?? '' },
    status: request.status,
    steps: request.steps.map((step: IApprovalStep) => ({
      approver: step.approver,
      label: APPROVER_LABEL[step.approver],
      assigneeName: nameOf(step.assignee),
      status: step.status,
      decidedByName: nameOf(step.decidedBy),
      decidedAt: step.decidedAt ? new Date(step.decidedAt).toISOString() : null,
      comment: step.comment ?? '',
    })),
    canDecide: canAct(viewer, request.steps.find((step: IApprovalStep) => step.status === 'pending'), String(request.requester)),
    createdAt: new Date(request.createdAt).toISOString(),
    updatedAt: new Date(request.updatedAt).toISOString(),
  }));
}

/** The viewer's approvals inbox: what waits on them, what they asked for, what they decided, and (HR/admins) everything open. */
export async function approvalInbox(viewer: Viewer) {
  const pending = await ApprovalRequest.find({ organizationId: viewer.organizationId, status: 'pending' }).sort({ createdAt: -1 }).limit(200).lean();
  const waiting = pending.filter((request) => isAssigned(viewer, request.steps.find((step) => step.status === 'pending'), String(request.requester)));
  const mine = await ApprovalRequest.find({ organizationId: viewer.organizationId, requester: viewer.id }).sort({ createdAt: -1 }).limit(100).lean();
  const decided = await ApprovalRequest.find({ organizationId: viewer.organizationId, 'steps.decidedBy': viewer.id }).sort({ updatedAt: -1 }).limit(50).lean();
  return {
    waiting: await toViews(viewer, waiting),
    mine: await toViews(viewer, mine),
    decided: await toViews(viewer, decided),
    /** Every open request, for HR and admins to follow up on. */
    open: isPeopleTeam(viewer.role) ? await toViews(viewer, pending) : [],
  };
}

/** The approval trail for one record, for the record's own page. */
export async function approvalForSubject(viewer: Viewer, subjectId: string): Promise<ApprovalView | null> {
  const request = await ApprovalRequest.findOne({ organizationId: viewer.organizationId, subjectId }).sort({ createdAt: -1 }).lean();
  return request ? (await toViews(viewer, [request]))[0] : null;
}

export async function approvalsForSubjects(viewer: Viewer, subjectIds: string[]): Promise<Map<string, ApprovalView>> {
  const requests = await ApprovalRequest.find({ organizationId: viewer.organizationId, subjectId: { $in: subjectIds } }).sort({ createdAt: 1 }).lean();
  const views = await toViews(viewer, requests);
  return new Map(views.map((view, index) => [String(requests[index].subjectId), view]));
}
