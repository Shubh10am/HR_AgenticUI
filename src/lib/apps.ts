/** Shared between the app access API and UI. Safe to import on the client. */
export const APP_CATEGORIES = ['Communication', 'Productivity', 'Engineering', 'Design', 'Sales', 'Finance', 'Other'] as const;
export type AppCategory = (typeof APP_CATEGORIES)[number];

/**
 * pending-approval → to-grant → granted → to-revoke → revoked.
 * "to-grant" and "to-revoke" are tasks for whoever administers the app.
 */
export type AccessStatus = 'pending-approval' | 'to-grant' | 'granted' | 'to-revoke' | 'revoked' | 'rejected';

export const ACCESS_LABEL: Record<AccessStatus, string> = {
  'pending-approval': 'Awaiting approval',
  'to-grant': 'Being set up',
  granted: 'Active',
  'to-revoke': 'Being removed',
  revoked: 'Removed',
  rejected: 'Not approved',
};

export interface AppView {
  id: string;
  name: string;
  url: string;
  category: AppCategory;
  description: string;
  /** Departments that get the app by default; "All" means everyone. */
  defaultFor: string[];
  requiresApproval: boolean;
  active: boolean;
}

export interface AccessView {
  id: string;
  app: AppView;
  employee: { id: string; name: string; department: string };
  status: AccessStatus;
  reason: string;
  /** Why it was created: a request, joining, or an exit. */
  source: 'request' | 'joiner' | 'exit' | 'admin';
  updatedAt: string;
}

export interface AppsOverview {
  catalogue: AppView[];
  mine: AccessView[];
  /** HR and admins: setup and removal tasks. */
  queue: AccessView[] | null;
}
