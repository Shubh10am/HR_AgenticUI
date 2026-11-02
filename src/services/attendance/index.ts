import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import AttendanceRecord from '@/models/AttendanceRecord';
import Employee from '@/models/Employee';
import LeaveRequest from '@/models/LeaveRequest';
import {
  ATTENDANCE_RULES,
  dayKeyOf,
  dayKeysBetween,
  dayStatusOf,
  instantAt,
  isLateClockIn,
  isWeekend,
  storedDateOf,
  type BoardRow,
  type DaySummary,
  type DayStatus,
} from '@/lib/attendance';

const minutesBetween = (from: Date, to: Date) => Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));

/** Recorded status saved on the record, kept in step with the shared rules. */
function recordStatus(clockIn: Date, clockOut?: Date | null) {
  if (isLateClockIn(clockIn)) return 'Late' as const;
  if (clockOut && minutesBetween(clockIn, clockOut) < ATTENDANCE_RULES.fullDayMinutes) return 'EarlyDeparture' as const;
  return 'Present' as const;
}

/** Approved leave overlapping the given days, keyed `${employeeId}:${dayKey}` → leave type. */
async function leaveByDay(organizationId: string, from: string, to: string, employeeId?: string) {
  const leaves = await LeaveRequest.find({
    organizationId,
    ...(employeeId ? { employeeId } : {}),
    status: 'Approved',
    startDate: { $lte: instantAt(to, '23:59') },
    endDate: { $gte: instantAt(from, '00:00') },
  })
    .select('employeeId leaveType startDate endDate')
    .lean();
  const map = new Map<string, string>();
  for (const leave of leaves) {
    const start = dayKeyOf(new Date(leave.startDate));
    const end = dayKeyOf(new Date(leave.endDate));
    for (const key of dayKeysBetween(start < from ? from : start, end > to ? to : end)) map.set(`${leave.employeeId}:${key}`, leave.leaveType);
  }
  return map;
}

/** Starts today's work session. */
export async function clockIn(employeeId: string, organizationId: string) {
  await dbConnect();
  const now = new Date();
  const dayKey = dayKeyOf(now);
  const existing = await AttendanceRecord.findOne({ employeeId, date: storedDateOf(dayKey) }).lean();
  if (existing) {
    return { status: 409, error: existing.clockOutTime ? 'You have already finished today. Ask HR if a time needs correcting.' : 'You are already clocked in.' };
  }
  try {
    const record = await AttendanceRecord.create({ employeeId, organizationId, date: storedDateOf(dayKey), clockInTime: now, status: recordStatus(now) });
    return { status: 201, record: { id: String(record._id), clockInTime: now.toISOString(), late: record.status === 'Late' } };
  } catch (error: any) {
    if (error?.code === 11000) return { status: 409, error: 'You are already clocked in.' };
    throw error;
  }
}

/** Ends today's work session. Older sessions left open are for HR to correct, not closed now. */
export async function clockOut(employeeId: string) {
  await dbConnect();
  const now = new Date();
  const record = await AttendanceRecord.findOne({ employeeId, date: storedDateOf(dayKeyOf(now)) });
  if (!record) return { status: 404, error: "You haven't clocked in today." };
  if (record.clockOutTime) return { status: 409, error: 'You have already clocked out today.' };
  record.clockOutTime = now;
  record.hoursWorked = minutesBetween(record.clockInTime, now);
  record.status = recordStatus(record.clockInTime, now);
  await record.save();
  return {
    status: 200,
    record: { id: String(record._id), clockInTime: record.clockInTime.toISOString(), clockOutTime: now.toISOString(), hoursWorked: record.hoursWorked },
  };
}

/** Everyone in the organization and how their given day went. */
export async function dayBoard(organizationId: string, dayKey: string): Promise<{ dayKey: string; rows: BoardRow[]; summary: DaySummary }> {
  await dbConnect();
  const now = new Date();
  const [people, records, leave] = await Promise.all([
    Employee.find({ organizationId }).select('name email department').sort({ name: 1 }).lean(),
    AttendanceRecord.find({ organizationId, date: storedDateOf(dayKey) }).lean(),
    leaveByDay(organizationId, dayKey, dayKey),
  ]);
  const recordOf = new Map(records.map((record) => [String(record.employeeId), record]));

  const rows: BoardRow[] = people.map((person) => {
    const id = String(person._id);
    const record = recordOf.get(id);
    const leaveType = leave.get(`${id}:${dayKey}`) ?? null;
    const clockOut = record?.clockOutTime ?? null;
    return {
      employeeId: id,
      name: person.name,
      email: person.email,
      department: person.department ?? '',
      recordId: record ? String(record._id) : null,
      clockIn: record ? record.clockInTime.toISOString() : null,
      clockOut: clockOut ? clockOut.toISOString() : null,
      minutes: record ? minutesBetween(record.clockInTime, clockOut ?? (dayKey === dayKeyOf(now) ? now : record.clockInTime)) : null,
      status: dayStatusOf({ dayKey, clockIn: record?.clockInTime, clockOut, onLeave: Boolean(leaveType), now }),
      leaveType,
      notes: record?.notes ?? null,
      adjustedBy: record?.adjustedBy ?? null,
    };
  });

  const count = (...statuses: DayStatus[]) => rows.filter((row) => statuses.includes(row.status)).length;
  const inCount = count('present', 'late', 'early-departure', 'working', 'no-clock-out');
  const onLeave = count('on-leave');
  const expected = rows.length - onLeave;
  const countsAsWorkday = dayKey <= dayKeyOf(now) && (!isWeekend(dayKey) || inCount > 0);
  return {
    dayKey,
    rows,
    summary: {
      total: rows.length,
      in: inCount,
      late: rows.filter((row) => row.clockIn && isLateClockIn(new Date(row.clockIn))).length,
      onLeave,
      absent: count('absent'),
      notInYet: count('not-in-yet'),
      rate: countsAsWorkday && expected > 0 ? Math.round((inCount / expected) * 100) : null,
    },
  };
}

/** One person's today plus a calendar month of their attendance. */
export async function myAttendance(employeeId: string, organizationId: string, month: string) {
  await dbConnect();
  const now = new Date();
  const today = dayKeyOf(now);
  const first = `${month}-01`;
  const last = dayKeysBetween(first, `${month}-31`).filter((key) => key.startsWith(month)).pop()!;
  const [records, leave] = await Promise.all([
    AttendanceRecord.find({ employeeId, date: { $gte: storedDateOf(first), $lte: storedDateOf(last) } }).lean(),
    leaveByDay(organizationId, first, last, employeeId),
  ]);
  const recordOf = new Map(records.map((record) => [record.date.toISOString().slice(0, 10), record]));

  const days = dayKeysBetween(first, last).map((dayKey) => {
    const record = recordOf.get(dayKey);
    const status = dayStatusOf({ dayKey, clockIn: record?.clockInTime, clockOut: record?.clockOutTime, onLeave: leave.has(`${employeeId}:${dayKey}`), now });
    return {
      dayKey,
      status,
      clockIn: record?.clockInTime.toISOString() ?? null,
      clockOut: record?.clockOutTime?.toISOString() ?? null,
      minutes: record?.clockOutTime ? minutesBetween(record.clockInTime, record.clockOutTime) : null,
    };
  });
  const count = (...statuses: DayStatus[]) => days.filter((day) => statuses.includes(day.status)).length;
  const worked = days.filter((day) => day.minutes != null);

  const todayRecord = await AttendanceRecord.findOne({ employeeId, date: storedDateOf(today) }).lean();
  return {
    today: {
      dayKey: today,
      clockIn: todayRecord?.clockInTime.toISOString() ?? null,
      clockOut: todayRecord?.clockOutTime?.toISOString() ?? null,
      status: dayStatusOf({ dayKey: today, clockIn: todayRecord?.clockInTime, clockOut: todayRecord?.clockOutTime, now }),
    },
    month,
    days,
    summary: {
      present: count('present', 'late', 'early-departure', 'working', 'no-clock-out'),
      late: days.filter((day) => day.clockIn && isLateClockIn(new Date(day.clockIn))).length,
      absent: count('absent'),
      onLeave: count('on-leave'),
      noClockOut: count('no-clock-out'),
      averageMinutes: worked.length ? Math.round(worked.reduce((sum, day) => sum + day.minutes!, 0) / worked.length) : null,
    },
  };
}

export interface AdjustInput {
  employeeId?: unknown;
  dayKey?: unknown;
  clockIn?: unknown;
  clockOut?: unknown;
  notes?: unknown;
  clear?: unknown;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * HR/Admin correction of one person's day: set clock-in and clock-out times, add a note,
 * or clear the day. Every change records who made it.
 *
 * @returns An error message, or null when saved.
 */
export async function adjustDay(organizationId: string, adjustedBy: string, input: AdjustInput): Promise<string | null> {
  const { employeeId, dayKey } = input;
  if (typeof employeeId !== 'string' || !mongoose.isValidObjectId(employeeId)) return 'Choose a person.';
  if (typeof dayKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return 'Choose a day.';
  if (dayKey > dayKeyOf()) return "You can't record attendance for a future day.";
  await dbConnect();
  const person = await Employee.exists({ _id: employeeId, organizationId });
  if (!person) return 'That person is not in your organization.';

  if (input.clear === true) {
    await AttendanceRecord.deleteOne({ employeeId, organizationId, date: storedDateOf(dayKey) });
    return null;
  }
  if (typeof input.clockIn !== 'string' || !TIME.test(input.clockIn)) return 'Enter a clock-in time.';
  const clockOutText = typeof input.clockOut === 'string' ? input.clockOut : '';
  if (clockOutText && !TIME.test(clockOutText)) return 'Enter a valid clock-out time, or leave it empty.';
  const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
  if (notes.length > 300) return 'Keep the note under 300 characters.';

  const clockInTime = instantAt(dayKey, input.clockIn);
  const clockOutTime = clockOutText ? instantAt(dayKey, clockOutText) : null;
  if (clockInTime > new Date()) return "Clock-in can't be in the future.";
  if (clockOutTime && clockOutTime <= clockInTime) return 'Clock-out must be after clock-in.';
  if (clockOutTime && clockOutTime > new Date()) return "Clock-out can't be in the future.";

  await AttendanceRecord.updateOne(
    { employeeId, date: storedDateOf(dayKey) },
    {
      $set: {
        organizationId,
        clockInTime,
        status: recordStatus(clockInTime, clockOutTime),
        notes,
        adjustedBy,
        adjustedAt: new Date(),
        ...(clockOutTime ? { clockOutTime, hoursWorked: minutesBetween(clockInTime, clockOutTime) } : {}),
      },
      ...(clockOutTime ? {} : { $unset: { clockOutTime: '', hoursWorked: '' } }),
    },
    { upsert: true }
  );
  return null;
}
