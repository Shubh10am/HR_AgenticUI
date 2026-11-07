import type { ApprovalView } from './approvals';

/** Shared between the offboarding API and UI. Safe to import on the client. */
export const EXIT_REASONS = ['Resignation', 'Retirement', 'End of contract', 'Other'] as const;
export type ExitReason = (typeof EXIT_REASONS)[number];
export type OffboardingStatus = 'pending-approval' | 'in-progress' | 'completed' | 'withdrawn' | 'rejected';
export type ChecklistOwner = 'Employee' | 'Manager' | 'IT' | 'HR' | 'Finance';

export const OFFBOARDING_STATUS_LABEL: Record<OffboardingStatus, string> = {
  'pending-approval': 'Awaiting approval',
  'in-progress': 'In progress',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
  rejected: 'Not accepted',
};

export const DEFAULT_NOTICE_DAYS = 30;

export const CHECKLIST_TEMPLATE: { key: string; label: string; owner: ChecklistOwner }[] = [
  { key: 'handover', label: 'Plan and complete the knowledge handover', owner: 'Manager' },
  { key: 'access', label: 'Remove access to systems and apps on the last day', owner: 'IT' },
  { key: 'devices', label: 'Collect laptop and other devices', owner: 'IT' },
  { key: 'badge', label: 'Collect ID card and building access', owner: 'HR' },
  { key: 'dues', label: 'Settle open expense claims and advances', owner: 'Finance' },
  { key: 'settlement', label: 'Process the final settlement', owner: 'HR' },
  { key: 'letters', label: 'Issue relieving and experience letters', owner: 'HR' },
  { key: 'exit-interview', label: 'Share exit feedback (optional)', owner: 'Employee' },
];

/** Exit interview questions; answers are seen by HR and admins only. */
export const EXIT_QUESTIONS = [
  { key: 'reason', label: 'What is the main reason you are leaving?' },
  { key: 'liked', label: 'What did you enjoy most about working here?' },
  { key: 'improve', label: 'What could we do better?' },
  { key: 'manager', label: 'How well did your manager support you? (optional)' },
] as const;

export interface ChecklistItemView {
  key: string;
  label: string;
  owner: ChecklistOwner;
  done: boolean;
  doneByName: string | null;
  doneAt: string | null;
  canTick: boolean;
}

export interface OffboardingView {
  id: string;
  employee: { id: string; name: string; department: string; jobTitle: string };
  reason: ExitReason;
  note: string;
  noticeGivenOn: string;
  lastWorkingDay: string;
  status: OffboardingStatus;
  checklist: ChecklistItemView[];
  progress: number;
  exitInterviewSubmitted: boolean;
  /** Only present for HR and admins. */
  exitInterview: { key: string; label: string; answer: string }[] | null;
  approval: ApprovalView | null;
  /** Equipment the person still holds, from the asset register. */
  assets: { tag: string; name: string; category: string }[];
  /** Apps the person can still sign in to. */
  apps: { name: string; status: string }[];
  mine: boolean;
  createdAt: string;
}
