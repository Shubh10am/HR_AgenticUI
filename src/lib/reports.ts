/** Shared between the reports API and UI. Safe to import on the client. */

/** Groups smaller than this are folded into "Other" so nobody can be singled out. */
export const MIN_GROUP = 5;

export interface MonthPoint {
  month: string; // yyyy-MM
  joiners: number;
  leavers: number;
}

export interface PeopleReport {
  generatedAt: string;
  headcount: number;
  byDepartment: { department: string; count: number }[];
  byRole: { role: string; count: number }[];
  monthly: MonthPoint[];
  /** Leavers in the last 12 months over average headcount, as a percentage. */
  attritionRate: number;
  leaversLast12: number;
  exitReasons: { reason: string; count: number }[];
  absence: { leaveDaysThisYear: number; averagePerPerson: number; byType: { type: string; days: number }[] };
  expenses: { approvedThisYear: number; currency: string; byCategory: { category: string; amount: number }[] };
  approvals: { open: number; oldestDays: number };
  learning: { mandatoryCompletion: number | null };
}
