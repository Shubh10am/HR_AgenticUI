import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/**
 * Attendance rules. Every "which day is it" and "is this late" decision uses these,
 * on the server and in the browser, so the two can never disagree.
 */
export const ATTENDANCE_RULES = {
  timeZone: 'Asia/Kolkata',
  timeZoneLabel: 'IST',
  /** Clocking in after this local time counts as late. Matches the published attendance policy. */
  lateAfter: '09:15',
  /** A completed day shorter than this is an early departure. */
  fullDayMinutes: 8 * 60,
  /** 0 = Sunday … 6 = Saturday. */
  weekendDays: [0, 6],
} as const;

export type DayStatus = 'present' | 'late' | 'early-departure' | 'working' | 'no-clock-out' | 'on-leave' | 'absent' | 'not-in-yet' | 'weekend' | 'upcoming';

export const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  present: 'Present',
  late: 'Late',
  'early-departure': 'Left early',
  working: 'Working now',
  'no-clock-out': "Didn't clock out",
  'on-leave': 'On leave',
  absent: 'Absent',
  'not-in-yet': 'Not in yet',
  weekend: 'Weekend',
  upcoming: 'Upcoming',
};

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** The local calendar day ("2026-11-02") an instant falls on. */
export const dayKeyOf = (instant: Date = new Date()) => formatInTimeZone(instant, ATTENDANCE_RULES.timeZone, 'yyyy-MM-dd');

export const isDayKey = (value: unknown): value is string => typeof value === 'string' && DAY_KEY.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

/** How a day is stored on a record: midnight UTC of that calendar date. */
export const storedDateOf = (dayKey: string) => new Date(`${dayKey}T00:00:00.000Z`);

/** The instant a local wall-clock time happens on a given day, e.g. ("2026-11-02", "09:15"). */
export const instantAt = (dayKey: string, time: string) => fromZonedTime(`${dayKey}T${time}:00`, ATTENDANCE_RULES.timeZone);

export const isWeekend = (dayKey: string) => (ATTENDANCE_RULES.weekendDays as readonly number[]).includes(storedDateOf(dayKey).getUTCDay());

/** Late when clocking in after the shift's cut-off (start + grace); the standard rule when no shift is given. */
export const isLateClockIn = (clockIn: Date, lateAfter: string = ATTENDANCE_RULES.lateAfter) => clockIn.getTime() > instantAt(dayKeyOf(clockIn), lateAfter).getTime();

/** The day keys from `from` to `to`, inclusive. */
export function dayKeysBetween(from: string, to: string): string[] {
  const keys: string[] = [];
  for (let day = storedDateOf(from); day <= storedDateOf(to) && keys.length < 400; day = new Date(day.getTime() + 86_400_000)) {
    keys.push(day.toISOString().slice(0, 10));
  }
  return keys;
}

export const formatMinutes = (minutes: number | null | undefined) =>
  minutes == null ? '—' : `${Math.floor(minutes / 60)}h ${String(Math.round(minutes % 60)).padStart(2, '0')}m`;

export const formatClock = (iso: string | null | undefined) => (iso ? formatInTimeZone(new Date(iso), ATTENDANCE_RULES.timeZone, 'hh:mm a') : '—');

interface DayFacts {
  dayKey: string;
  clockIn?: Date | null;
  clockOut?: Date | null;
  onLeave?: boolean;
  now?: Date;
  /** From the person's shift; defaults to the standard rule. */
  lateAfter?: string;
  /** The person's days off each week (0 = Sunday); defaults to the weekend. */
  weeklyOff?: number[];
}

/** One person's status for one day. */
export function dayStatusOf({ dayKey, clockIn, clockOut, onLeave, now = new Date(), lateAfter = ATTENDANCE_RULES.lateAfter, weeklyOff }: DayFacts): DayStatus {
  if (clockIn) {
    if (!clockOut) return dayKey < dayKeyOf(now) ? 'no-clock-out' : 'working';
    if (isLateClockIn(clockIn, lateAfter)) return 'late';
    const minutes = (clockOut.getTime() - clockIn.getTime()) / 60_000;
    return minutes < ATTENDANCE_RULES.fullDayMinutes ? 'early-departure' : 'present';
  }
  if (onLeave) return 'on-leave';
  const today = dayKeyOf(now);
  if (dayKey > today) return 'upcoming';
  if (weeklyOff ? weeklyOff.includes(storedDateOf(dayKey).getUTCDay()) : isWeekend(dayKey)) return 'weekend';
  if (dayKey === today && now < instantAt(dayKey, lateAfter)) return 'not-in-yet';
  return 'absent';
}

export interface BoardRow {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  recordId: string | null;
  clockIn: string | null;
  clockOut: string | null;
  minutes: number | null;
  status: DayStatus;
  leaveType: string | null;
  notes: string | null;
  adjustedBy: string | null;
  /** The person's shift that day and its late cut-off (HH:mm). */
  shiftName?: string;
  lateAfter?: string;
}

export interface DaySummary {
  total: number;
  /** Clocked in at all, including late and still working. */
  in: number;
  late: number;
  onLeave: number;
  absent: number;
  notInYet: number;
  /** In ÷ people expected (everyone not on leave), or null on weekends and future days. */
  rate: number | null;
}

export interface DayBoard {
  dayKey: string;
  rows: BoardRow[];
  summary: DaySummary;
}

export interface MyDay {
  dayKey: string;
  status: DayStatus;
  clockIn: string | null;
  clockOut: string | null;
  minutes: number | null;
  /** The late cut-off from that day's shift (HH:mm). */
  lateAfter?: string;
}

/** What `/api/attendance/me` returns. */
export interface MyAttendance {
  today: { dayKey: string; clockIn: string | null; clockOut: string | null; status: DayStatus; shift?: { name: string; start: string; end: string; lateAfter: string } };
  month: string;
  days: MyDay[];
  summary: { present: number; late: number; absent: number; onLeave: number; noClockOut: number; averageMinutes: number | null };
}
