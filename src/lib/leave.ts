/** Shared between the leave API and UI. Safe to import on the client. */
export const LEAVE_TYPES = ['Annual', 'Sick', 'Unpaid', 'Maternity', 'Paternity', 'Bereavement', 'Other'] as const;
export type LeaveTypeName = (typeof LEAVE_TYPES)[number];

export interface LeaveTypePolicy {
  type: LeaveTypeName;
  /** Days per year; null means the type is not limited by a balance. */
  annualDays: number | null;
  /** Unused days that roll into next year. */
  carryForwardMax: number;
  /** 'monthly' earns days evenly through the year; 'upfront' grants them on 1 January. */
  accrual: 'upfront' | 'monthly';
  enabled: boolean;
}

/**
 * Starting values only. Statutory leave (e.g. maternity and paternity) differs by country,
 * so those types are untracked until HR sets them to match local law.
 */
export const DEFAULT_LEAVE_POLICY: LeaveTypePolicy[] = [
  { type: 'Annual', annualDays: 18, carryForwardMax: 5, accrual: 'monthly', enabled: true },
  { type: 'Sick', annualDays: 10, carryForwardMax: 0, accrual: 'upfront', enabled: true },
  { type: 'Bereavement', annualDays: 5, carryForwardMax: 0, accrual: 'upfront', enabled: true },
  { type: 'Maternity', annualDays: null, carryForwardMax: 0, accrual: 'upfront', enabled: true },
  { type: 'Paternity', annualDays: null, carryForwardMax: 0, accrual: 'upfront', enabled: true },
  { type: 'Unpaid', annualDays: null, carryForwardMax: 0, accrual: 'upfront', enabled: true },
  { type: 'Other', annualDays: null, carryForwardMax: 0, accrual: 'upfront', enabled: false },
];

export interface LeaveBalance {
  type: LeaveTypeName;
  tracked: boolean;
  entitled: number;
  carriedForward: number;
  used: number;
  pending: number;
  available: number | null;
}

export interface LeaveRequestView {
  id: string;
  type: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  employee: { id: string; name: string; department: string };
  approvalSteps: { label: string; status: string; byName: string | null; comment: string }[];
}

export interface HolidayView {
  id: string;
  date: string;
  name: string;
  optional: boolean;
}

export interface LeaveOverview {
  year: number;
  balances: LeaveBalance[];
  requests: LeaveRequestView[];
  holidays: HolidayView[];
  policy: LeaveTypePolicy[];
}

/** Who is away on which days; the leave type is deliberately left out. */
export interface AwayEntry {
  employee: { id: string; name: string; department: string };
  startDate: string;
  endDate: string;
  pending: boolean;
}
