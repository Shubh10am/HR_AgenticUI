/** Shared between the approvals API and UI. Safe to import on the client. */

export const APPROVAL_KINDS = ['expense', 'offboarding', 'leave', 'timesheet', 'app-access'] as const;
export type ApprovalKind = (typeof APPROVAL_KINDS)[number];

export const APPROVAL_KIND_LABEL: Record<ApprovalKind, string> = {
  expense: 'Expense claim',
  offboarding: 'Resignation / exit',
  leave: 'Leave request',
  timesheet: 'Timesheet',
  'app-access': 'App access',
};

/** Who approves a step: the requester's manager, or anyone holding a role. */
export type ApproverType = 'manager' | 'HR' | 'Admin';
export const APPROVER_LABEL: Record<ApproverType, string> = { manager: "Requester's manager", HR: 'HR team', Admin: 'Admins' };

export interface PolicyStep {
  approver: ApproverType;
  /** The step only applies when the request's amount is at least this. */
  minAmount?: number | null;
}

export type StepStatus = 'waiting' | 'pending' | 'approved' | 'rejected' | 'skipped';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ApprovalStepView {
  approver: ApproverType;
  label: string;
  /** Set for a manager step. */
  assigneeName: string | null;
  status: StepStatus;
  decidedByName: string | null;
  decidedAt: string | null;
  comment: string;
}

export interface ApprovalView {
  id: string;
  kind: ApprovalKind;
  title: string;
  summary: string;
  amount: number | null;
  currency: string | null;
  requester: { id: string; name: string; department: string };
  status: ApprovalStatus;
  steps: ApprovalStepView[];
  canDecide: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Default chains when an organisation has not set its own. */
export const DEFAULT_POLICIES: Record<ApprovalKind, PolicyStep[]> = {
  expense: [{ approver: 'manager' }, { approver: 'HR', minAmount: 10000 }],
  offboarding: [{ approver: 'manager' }, { approver: 'HR' }],
  leave: [{ approver: 'manager' }],
  timesheet: [{ approver: 'manager' }],
  'app-access': [{ approver: 'manager' }],
};
