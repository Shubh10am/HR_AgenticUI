/** Shared between the shifts API and UI. Safe to import on the client. */
export interface ShiftView {
  id: string;
  name: string;
  /** Local wall-clock times, HH:mm, in the organisation's time zone. */
  start: string;
  end: string;
  graceMinutes: number;
  /** Days off each week: 0 = Sunday … 6 = Saturday. */
  weeklyOff: number[];
  color: string;
  assigned: number;
}

/** What attendance needs to know about someone's shift on a day. */
export interface ShiftRule {
  shiftId: string | null;
  name: string;
  start: string;
  end: string;
  lateAfter: string;
  weeklyOff: number[];
}

/** Used for anyone without an assigned shift; matches the published attendance policy. */
export const DEFAULT_SHIFT_RULE: ShiftRule = { shiftId: null, name: 'Standard', start: '09:00', end: '18:00', lateAfter: '09:15', weeklyOff: [0, 6] };

export const SHIFT_COLORS = ['violet', 'sky', 'emerald', 'amber', 'rose', 'teal'] as const;
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + minutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export interface RosterCell {
  kind: 'shift' | 'off' | 'away' | 'holiday';
  label: string;
  shiftId: string | null;
}

export interface RosterView {
  weekStart: string;
  days: string[];
  rows: { employee: { id: string; name: string; department: string }; cells: RosterCell[] }[];
}
