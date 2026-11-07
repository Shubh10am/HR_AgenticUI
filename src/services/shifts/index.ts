import mongoose from 'mongoose';
import Shift from '@/models/Shift';
import ShiftAssignment from '@/models/ShiftAssignment';
import Employee from '@/models/Employee';
import LeaveRequest from '@/models/LeaveRequest';
import Holiday from '@/models/Holiday';
import { ApiError, isPeopleTeam, requireRole, type Viewer } from '@/lib/api-route';
import { dayKeyOf, dayKeysBetween, storedDateOf } from '@/lib/attendance';
import { DEFAULT_SHIFT_RULE, SHIFT_COLORS, addMinutes, type RosterView, type ShiftRule, type ShiftView } from '@/lib/shifts';

const MANAGERS = ['Admin', 'HR'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Loads everyone's shifts for a date range once, and answers "which shift is this person on this day?".
 * Without an assignment, the standard rule applies.
 */
export async function shiftResolver(organizationId: string, employeeIds: string[], from: string, to: string) {
  const [shifts, assignments] = await Promise.all([
    Shift.find({ organizationId }).lean(),
    ShiftAssignment.find({ organizationId, employee: { $in: employeeIds }, from: { $lte: to }, $or: [{ to: null }, { to: { $gte: from } }] }).sort({ from: -1, createdAt: -1 }).lean(),
  ]);
  const byId = new Map(shifts.map((shift) => [String(shift._id), shift]));
  return (employeeId: string, dayKey: string): ShiftRule => {
    const assignment = assignments.find((item) => String(item.employee) === employeeId && item.from <= dayKey && (!item.to || item.to >= dayKey));
    const shift = assignment ? byId.get(String(assignment.shift)) : undefined;
    if (!shift) return DEFAULT_SHIFT_RULE;
    return { shiftId: String(shift._id), name: shift.name, start: shift.start, end: shift.end, lateAfter: addMinutes(shift.start, shift.graceMinutes), weeklyOff: shift.weeklyOff };
  };
}

/** Shift patterns with how many people are on each today. */
export async function listShifts(viewer: Viewer): Promise<ShiftView[]> {
  const today = dayKeyOf();
  const shifts = await Shift.find({ organizationId: viewer.organizationId, archived: false }).sort({ start: 1 }).lean();
  const people = await Employee.find({ organizationId: viewer.organizationId }).distinct('_id');
  const resolve = await shiftResolver(viewer.organizationId, people.map(String), today, today);
  const counts = new Map<string, number>();
  for (const id of people) {
    const rule = resolve(String(id), today);
    if (rule.shiftId) counts.set(rule.shiftId, (counts.get(rule.shiftId) ?? 0) + 1);
  }
  return shifts.map((shift) => ({
    id: String(shift._id),
    name: shift.name,
    start: shift.start,
    end: shift.end,
    graceMinutes: shift.graceMinutes,
    weeklyOff: shift.weeklyOff,
    color: shift.color,
    assigned: counts.get(String(shift._id)) ?? 0,
  }));
}

function cleanShift(input: Record<string, unknown>) {
  const name = String(input.name ?? '').trim().slice(0, 40);
  const start = String(input.start ?? '');
  const end = String(input.end ?? '');
  if (!name) throw new ApiError('Name the shift, e.g. "Morning".');
  if (!TIME.test(start) || !TIME.test(end)) throw new ApiError('Use 24-hour times like 09:00 and 18:00.');
  const graceMinutes = Math.round(Number(input.graceMinutes ?? 15));
  if (!Number.isFinite(graceMinutes) || graceMinutes < 0 || graceMinutes > 120) throw new ApiError('Grace must be between 0 and 120 minutes.');
  const weeklyOff = Array.isArray(input.weeklyOff) ? [...new Set(input.weeklyOff.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))] : [0, 6];
  if (weeklyOff.length > 4) throw new ApiError('A shift needs at least three working days a week.');
  const color = SHIFT_COLORS.includes(input.color as never) ? String(input.color) : 'violet';
  return { name, start, end, graceMinutes, weeklyOff, color };
}

export async function createShift(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, MANAGERS, 'Only HR and admins manage shifts.');
  await Shift.create({ organizationId: viewer.organizationId, ...cleanShift(input) });
  return listShifts(viewer);
}

export async function updateShift(viewer: Viewer, id: unknown, input: Record<string, unknown>) {
  requireRole(viewer, MANAGERS, 'Only HR and admins manage shifts.');
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown shift.');
  const shift = await Shift.findOne({ _id: id, organizationId: viewer.organizationId });
  if (!shift) throw new ApiError('Shift not found.', 404);
  if (input.archived === true) {
    const today = dayKeyOf();
    if (await ShiftAssignment.exists({ shift: shift._id, $or: [{ to: null }, { to: { $gte: today } }] })) throw new ApiError('Move people off this shift before archiving it.');
    shift.archived = true;
  } else Object.assign(shift, cleanShift(input));
  await shift.save();
  return listShifts(viewer);
}

/** Puts people on a shift from a date (HR and admins). Their previous open assignment ends the day before. */
export async function assignShift(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, MANAGERS, 'Only HR and admins assign shifts.');
  const ids = (Array.isArray(input.employeeIds) ? input.employeeIds : []).filter((id): id is string => typeof id === 'string' && mongoose.isValidObjectId(id));
  if (ids.length === 0) throw new ApiError('Choose at least one person.');
  const from = String(input.from ?? dayKeyOf());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new ApiError('Choose a start date.');
  const shiftId = input.shiftId === null || input.shiftId === 'standard' ? null : String(input.shiftId ?? '');
  if (shiftId && !(await Shift.exists({ _id: shiftId, organizationId: viewer.organizationId, archived: false }))) throw new ApiError('Choose a shift.');
  const valid = await Employee.find({ _id: { $in: ids }, organizationId: viewer.organizationId }).distinct('_id');
  const dayBefore = new Date(storedDateOf(from).getTime() - 86_400_000).toISOString().slice(0, 10);
  for (const employee of valid) {
    await ShiftAssignment.deleteMany({ employee, from: { $gte: from } });
    await ShiftAssignment.updateMany({ employee, from: { $lt: from }, $or: [{ to: null }, { to: { $gte: from } }] }, { $set: { to: dayBefore } });
    if (shiftId) await ShiftAssignment.create({ organizationId: viewer.organizationId, employee, shift: shiftId, from });
  }
  return { updated: valid.length };
}

/**
 * The roster for a week: each person's shift per day, or off / away / holiday.
 * HR and admins see everyone; managers their reports; everyone else themselves. Leave types are not shown.
 */
export async function roster(viewer: Viewer, weekStartInput: unknown): Promise<RosterView> {
  const base = typeof weekStartInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(weekStartInput) ? weekStartInput : dayKeyOf();
  const date = storedDateOf(base);
  const monday = new Date(date.getTime() - ((date.getUTCDay() + 6) % 7) * 86_400_000).toISOString().slice(0, 10);
  const days = dayKeysBetween(monday, new Date(storedDateOf(monday).getTime() + 6 * 86_400_000).toISOString().slice(0, 10));

  let filter: Record<string, unknown> = { _id: viewer.id };
  if (isPeopleTeam(viewer.role)) filter = { organizationId: viewer.organizationId };
  else if (await Employee.exists({ managerId: viewer.id })) filter = { organizationId: viewer.organizationId, $or: [{ _id: viewer.id }, { managerId: viewer.id }] };
  const people = await Employee.find(filter).select('name department').sort({ name: 1 }).lean();
  const ids = people.map((person) => String(person._id));
  const [resolve, leave, holidays] = await Promise.all([
    shiftResolver(viewer.organizationId, ids, days[0], days[6]),
    LeaveRequest.find({ employeeId: { $in: ids }, status: 'Approved', startDate: { $lte: storedDateOf(days[6]) }, endDate: { $gte: storedDateOf(days[0]) } }).select('employeeId startDate endDate').lean(),
    Holiday.find({ organizationId: viewer.organizationId, optional: false, date: { $gte: days[0], $lte: days[6] } }).lean(),
  ]);
  const holidayName = new Map(holidays.map((holiday) => [holiday.date, holiday.name]));
  return {
    weekStart: monday,
    days,
    rows: people.map((person) => {
      const id = String(person._id);
      return {
        employee: { id, name: person.name, department: person.department ?? '' },
        cells: days.map((day) => {
          if (holidayName.has(day)) return { kind: 'holiday' as const, label: holidayName.get(day)!, shiftId: null };
          const away = leave.some((row) => String(row.employeeId) === id && row.startDate.toISOString().slice(0, 10) <= day && row.endDate.toISOString().slice(0, 10) >= day);
          if (away) return { kind: 'away' as const, label: 'Away', shiftId: null };
          const rule = resolve(id, day);
          if (rule.weeklyOff.includes(storedDateOf(day).getUTCDay())) return { kind: 'off' as const, label: 'Off', shiftId: rule.shiftId };
          return { kind: 'shift' as const, label: `${rule.name} · ${rule.start}–${rule.end}`, shiftId: rule.shiftId };
        }),
      };
    }),
  };
}
