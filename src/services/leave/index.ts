import mongoose from 'mongoose';
import LeaveRequest from '@/models/LeaveRequest';
import LeavePolicy from '@/models/LeavePolicy';
import Holiday from '@/models/Holiday';
import Employee from '@/models/Employee';
import ApprovalRequest from '@/models/ApprovalRequest';
import { ApiError, isPeopleTeam, requireRole, type Viewer } from '@/lib/api-route';
import { cancelApproval, startApproval } from '@/services/approvals';
import { dayKeyOf, dayKeysBetween, isWeekend, storedDateOf } from '@/lib/attendance';
import { APPROVER_LABEL } from '@/lib/approvals';
import {
  DEFAULT_LEAVE_POLICY,
  LEAVE_TYPES,
  type AwayEntry,
  type HolidayView,
  type LeaveBalance,
  type LeaveOverview,
  type LeaveRequestView,
  type LeaveTypeName,
  type LeaveTypePolicy,
} from '@/lib/leave';

const MANAGERS = ['Admin', 'HR'];
const keyOf = (date: Date) => date.toISOString().slice(0, 10);

/** The organisation's leave types, filling any type it has not configured from the defaults. */
export async function leavePolicy(organizationId: string): Promise<LeaveTypePolicy[]> {
  const stored = await LeavePolicy.findOne({ organizationId }).lean();
  return DEFAULT_LEAVE_POLICY.map((fallback) => stored?.types.find((type) => type.type === fallback.type) ?? fallback);
}

export async function holidayKeys(organizationId: string, from: string, to: string) {
  const rows = await Holiday.find({ organizationId, optional: false, date: { $gte: from, $lte: to } }).select('date').lean();
  return new Set(rows.map((row) => row.date));
}

/** Working days between two dates: weekends and (non-optional) holidays don't count. */
export async function workingDays(organizationId: string, from: string, to: string) {
  const holidays = await holidayKeys(organizationId, from, to);
  return dayKeysBetween(from, to).filter((day) => !isWeekend(day) && !holidays.has(day)).length;
}

async function daysOf(organizationId: string, request: { startDate: Date; endDate: Date }, year?: number) {
  let from = keyOf(request.startDate);
  let to = keyOf(request.endDate);
  if (year) {
    from = from < `${year}-01-01` ? `${year}-01-01` : from;
    to = to > `${year}-12-31` ? `${year}-12-31` : to;
    if (from > to) return 0;
  }
  return workingDays(organizationId, from, to);
}

/** Balances for one person for one year: earned so far plus carried forward, minus approved and pending days. */
export async function balancesFor(organizationId: string, employeeId: string, year: number): Promise<LeaveBalance[]> {
  const policy = await leavePolicy(organizationId);
  const requests = await LeaveRequest.find({
    employeeId,
    status: { $in: ['Pending', 'Approved'] },
    startDate: { $lte: new Date(`${year}-12-31T23:59:59Z`) },
    endDate: { $gte: new Date(`${year - 1}-01-01T00:00:00Z`) },
  }).lean();
  const now = new Date();
  const person = await Employee.findById(employeeId).select('joinedAt createdAt').lean();
  const joined = new Date(person?.joinedAt ?? person?.createdAt ?? `${year}-01-01`);
  const joinedThisYear = joined.getUTCFullYear() === year;
  // Months worked this year: from the joining month (for people who joined this year) to now.
  const firstMonth = joinedThisYear ? joined.getUTCMonth() : 0;
  const lastMonth = year < now.getUTCFullYear() ? 12 : year > now.getUTCFullYear() ? 0 : now.getUTCMonth() + 1;
  const monthsElapsed = Math.max(0, lastMonth - firstMonth);
  const monthsInYear = 12 - firstMonth;
  const employedLastYear = joined.getUTCFullYear() < year;

  const result: LeaveBalance[] = [];
  for (const type of policy.filter((item) => item.enabled)) {
    const ofType = requests.filter((request) => request.leaveType === type.type);
    let used = 0;
    let pending = 0;
    let usedLastYear = 0;
    for (const request of ofType) {
      const days = await daysOf(organizationId, request, year);
      if (request.status === 'Approved') used += days;
      else pending += days;
      if (request.status === 'Approved') usedLastYear += await daysOf(organizationId, request, year - 1);
    }
    if (type.annualDays === null) {
      result.push({ type: type.type, tracked: false, entitled: 0, carriedForward: 0, used, pending, available: null });
      continue;
    }
    // Monthly types earn evenly; upfront types are granted at once, pro rata for people who joined this year.
    const share = type.accrual === 'monthly' ? monthsElapsed / 12 : monthsInYear / 12;
    const entitled = Math.round(type.annualDays * share * 2) / 2;
    const carriedForward = employedLastYear ? Math.max(0, Math.min(type.carryForwardMax, type.annualDays - usedLastYear)) : 0;
    result.push({ type: type.type, tracked: true, entitled, carriedForward, used, pending, available: entitled + carriedForward - used - pending });
  }
  return result;
}

async function toViews(organizationId: string, requests: any[]): Promise<LeaveRequestView[]> {
  const people = new Map((await Employee.find({ _id: { $in: requests.map((request) => request.employeeId) } }).select('name department').lean()).map((person) => [String(person._id), person]));
  const approvals = await ApprovalRequest.find({ subjectId: { $in: requests.map((request) => request._id) } }).lean();
  const deciders = new Map((await Employee.find({ _id: { $in: approvals.flatMap((approval) => approval.steps.map((step) => step.decidedBy ?? step.assignee).filter(Boolean)) } }).select('name').lean()).map((person) => [String(person._id), person.name]));
  return Promise.all(
    requests.map(async (request) => {
      const approval = approvals.find((item) => String(item.subjectId) === String(request._id));
      return {
        id: String(request._id),
        type: request.leaveType,
        startDate: keyOf(request.startDate),
        endDate: keyOf(request.endDate),
        days: await daysOf(organizationId, request),
        reason: request.reason ?? '',
        status: request.status,
        employee: { id: String(request.employeeId), name: people.get(String(request.employeeId))?.name ?? 'Former colleague', department: people.get(String(request.employeeId))?.department ?? '' },
        approvalSteps: (approval?.steps ?? []).map((step) => ({
          label: step.approver === 'manager' && step.assignee ? deciders.get(String(step.assignee)) ?? APPROVER_LABEL.manager : APPROVER_LABEL[step.approver],
          status: step.status,
          byName: step.decidedBy ? deciders.get(String(step.decidedBy)) ?? null : null,
          comment: step.comment ?? '',
        })),
      };
    })
  );
}

/** The viewer's balances, requests and the year's holidays. */
export async function leaveOverview(viewer: Viewer, yearInput?: unknown): Promise<LeaveOverview> {
  const year = Number(yearInput) || new Date().getUTCFullYear();
  const [balances, requests, holidays, policy] = await Promise.all([
    balancesFor(viewer.organizationId, viewer.id, year),
    LeaveRequest.find({ employeeId: viewer.id }).sort({ startDate: -1 }).limit(100).lean(),
    Holiday.find({ organizationId: viewer.organizationId, date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } }).sort({ date: 1 }).lean(),
    leavePolicy(viewer.organizationId),
  ]);
  return {
    year,
    balances,
    requests: await toViews(viewer.organizationId, requests),
    holidays: holidays.map((holiday) => ({ id: String(holiday._id), date: holiday.date, name: holiday.name, optional: holiday.optional })),
    policy,
  };
}

/**
 * Requests leave: checks dates, overlaps and (for limited types) the balance, then sends it for approval.
 */
export async function submitLeave(viewer: Viewer, input: Record<string, unknown>): Promise<LeaveRequestView> {
  const type = input.leaveType as LeaveTypeName;
  const policy = (await leavePolicy(viewer.organizationId)).find((item) => item.type === type);
  if (!LEAVE_TYPES.includes(type) || !policy?.enabled) throw new ApiError('Choose a leave type.');
  const from = String(input.startDate ?? '').slice(0, 10);
  const to = String(input.endDate ?? from).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new ApiError('Choose the start and end dates.');
  if (to < from) throw new ApiError('The end date is before the start date.');
  if (from < keyOf(new Date(Date.now() - 30 * 86_400_000))) throw new ApiError('Leave more than 30 days in the past needs HR to record it.');
  const days = await workingDays(viewer.organizationId, from, to);
  if (days === 0) throw new ApiError('Those dates are all weekends or holidays.');

  const startDate = storedDateOf(from);
  const endDate = storedDateOf(to);
  const overlap = await LeaveRequest.exists({ employeeId: viewer.id, status: { $in: ['Pending', 'Approved'] }, startDate: { $lte: endDate }, endDate: { $gte: startDate } });
  if (overlap) throw new ApiError('You already have leave on some of these days.');
  if (policy.annualDays !== null) {
    const balance = (await balancesFor(viewer.organizationId, viewer.id, Number(from.slice(0, 4)))).find((item) => item.type === type);
    if (balance && balance.available !== null && days > balance.available) throw new ApiError(`Only ${balance.available} ${type.toLowerCase()} days are available.`);
  }

  const request = await LeaveRequest.create({
    employeeId: viewer.id,
    organizationId: viewer.organizationId,
    leaveType: type,
    startDate,
    endDate,
    reason: String(input.reason ?? '').trim().slice(0, 500) || `${type} leave`,
    status: 'Pending',
  });
  await startApproval({
    viewer,
    kind: 'leave',
    subjectId: request._id as mongoose.Types.ObjectId,
    title: `${type} leave · ${days} day${days === 1 ? '' : 's'}`,
    summary: from === to ? from : `${from} to ${to}`,
  });
  return (await toViews(viewer.organizationId, [(await LeaveRequest.findById(request._id).lean())!]))[0];
}

/** Called by the approval engine. */
export async function onLeaveSettled(id: string, outcome: 'approved' | 'rejected' | 'cancelled') {
  const status = outcome === 'approved' ? 'Approved' : outcome === 'rejected' ? 'Rejected' : 'Cancelled';
  await LeaveRequest.updateOne({ _id: id, status: 'Pending' }, { $set: { status, reviewedAt: new Date() } });
}

/** Withdraws a pending request, or cancels approved leave that has not started yet. */
export async function withdrawLeave(viewer: Viewer, id: unknown) {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown request.');
  const request = await LeaveRequest.findOne({ _id: id, employeeId: viewer.id });
  if (!request) throw new ApiError('Request not found.', 404);
  const notStarted = keyOf(request.startDate) > dayKeyOf();
  if (request.status !== 'Pending' && !(request.status === 'Approved' && notStarted)) throw new ApiError('Only pending or upcoming leave can be withdrawn.');
  const wasPending = request.status === 'Pending';
  request.status = 'Cancelled';
  await request.save();
  if (wasPending) await cancelApproval(viewer, String(request._id));
  return leaveOverview(viewer);
}

/** Who is away in a month: everyone for HR and admins, otherwise your team. The leave type is never included. */
export async function awayInMonth(viewer: Viewer, month: unknown): Promise<AwayEntry[]> {
  const key = typeof month === 'string' && /^\d{4}-\d{2}$/.test(month) ? month : dayKeyOf().slice(0, 7);
  const start = storedDateOf(`${key}-01`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  let scope: Record<string, unknown> = { employeeId: viewer.id };
  if (isPeopleTeam(viewer.role)) scope = { organizationId: viewer.organizationId };
  else {
    // Your team: people who share your manager, your manager, and anyone who reports to you.
    const me = await Employee.findById(viewer.id).select('managerId').lean();
    const team = await Employee.find({
      organizationId: viewer.organizationId,
      $or: [{ managerId: viewer.id }, ...(me?.managerId ? [{ managerId: me.managerId }, { _id: me.managerId }] : [])],
    }).distinct('_id');
    scope = { employeeId: { $in: [viewer.id, ...team] } };
  }
  const rows = await LeaveRequest.find({ ...scope, status: { $in: ['Pending', 'Approved'] }, startDate: { $lte: end }, endDate: { $gte: start } }).lean();
  const people = new Map((await Employee.find({ _id: { $in: rows.map((row) => row.employeeId) } }).select('name department').lean()).map((person) => [String(person._id), person]));
  return rows.map((row) => ({
    employee: { id: String(row.employeeId), name: people.get(String(row.employeeId))?.name ?? 'Former colleague', department: people.get(String(row.employeeId))?.department ?? '' },
    startDate: keyOf(row.startDate),
    endDate: keyOf(row.endDate),
    pending: row.status === 'Pending',
  }));
}

/** Replaces the leave types (HR and admins). */
export async function saveLeavePolicy(viewer: Viewer, types: unknown) {
  requireRole(viewer, MANAGERS, 'Only HR and admins change leave policy.');
  if (!Array.isArray(types)) throw new ApiError('Send the leave types.');
  const clean = DEFAULT_LEAVE_POLICY.map((fallback) => {
    const given = (types as Partial<LeaveTypePolicy>[]).find((type) => type?.type === fallback.type) ?? fallback;
    const annual = given.annualDays === null || given.annualDays === undefined || (given.annualDays as unknown) === '' ? null : Number(given.annualDays);
    if (annual !== null && (!Number.isFinite(annual) || annual < 0 || annual > 365)) throw new ApiError(`Days for ${fallback.type} must be between 0 and 365.`);
    const carry = Number(given.carryForwardMax ?? 0);
    if (!Number.isFinite(carry) || carry < 0 || carry > 365) throw new ApiError(`Carry-forward for ${fallback.type} must be between 0 and 365.`);
    return { type: fallback.type, annualDays: annual, carryForwardMax: carry, accrual: given.accrual === 'monthly' ? 'monthly' : 'upfront', enabled: given.enabled !== false } as LeaveTypePolicy;
  });
  await LeavePolicy.updateOne({ organizationId: viewer.organizationId }, { $set: { types: clean, updatedBy: viewer.id } }, { upsert: true });
  return clean;
}

/** Adds a holiday (HR and admins). */
export async function addHoliday(viewer: Viewer, input: Record<string, unknown>): Promise<HolidayView[]> {
  requireRole(viewer, MANAGERS, 'Only HR and admins manage holidays.');
  const date = String(input.date ?? '');
  const name = String(input.name ?? '').trim().slice(0, 80);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !name) throw new ApiError('Add a date and a name.');
  if (await Holiday.exists({ organizationId: viewer.organizationId, date })) throw new ApiError('There is already a holiday on that date.');
  await Holiday.create({ organizationId: viewer.organizationId, date, name, optional: !!input.optional });
  return (await leaveOverview(viewer, date.slice(0, 4))).holidays;
}

export async function removeHoliday(viewer: Viewer, id: unknown) {
  requireRole(viewer, MANAGERS, 'Only HR and admins manage holidays.');
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown holiday.');
  await Holiday.deleteOne({ _id: id, organizationId: viewer.organizationId });
  return { ok: true };
}
