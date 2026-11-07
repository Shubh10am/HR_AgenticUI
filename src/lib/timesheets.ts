import type { ApprovalView } from './approvals';

/** Shared between the timesheets API and UI. Safe to import on the client. */
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export const TIMESHEET_STATUS_LABEL: Record<TimesheetStatus, string> = { draft: 'Draft', submitted: 'Submitted', approved: 'Approved', rejected: 'Sent back' };

export interface ProjectView {
  id: string;
  name: string;
  client: string;
  code: string;
  billable: boolean;
  active: boolean;
}

export interface WeekEntry {
  projectId: string;
  date: string;
  hours: number;
  note: string;
}

export interface TimesheetWeekView {
  id: string | null;
  weekStart: string;
  days: string[];
  status: TimesheetStatus;
  totalHours: number;
  entries: WeekEntry[];
  projects: ProjectView[];
  approval: ApprovalView | null;
  editable: boolean;
}

export interface TimeReport {
  from: string;
  to: string;
  totalHours: number;
  billableHours: number;
  byProject: { project: ProjectView; hours: number; people: number }[];
  byPerson: { employee: { id: string; name: string; department: string }; hours: number; billableHours: number }[];
}

/** Monday of the week containing a day (YYYY-MM-DD). */
export const mondayOf = (day: string) => {
  const date = new Date(`${day}T00:00:00Z`);
  return new Date(date.getTime() - ((date.getUTCDay() + 6) % 7) * 86_400_000).toISOString().slice(0, 10);
};
