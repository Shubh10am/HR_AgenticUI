/** Shared between the learning API and UI. Safe to import on the client. */
export const COURSE_CATEGORIES = ['Compliance', 'Security', 'Skills', 'Leadership', 'Onboarding', 'Wellbeing'] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];
export type EnrollmentStatus = 'assigned' | 'in-progress' | 'completed';

export const ENROLLMENT_LABEL: Record<EnrollmentStatus, string> = { assigned: 'Not started', 'in-progress': 'In progress', completed: 'Completed' };

export interface CourseView {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  url: string;
  durationMins: number;
  /** Mandatory courses are assigned to everyone and tracked for compliance. */
  mandatory: boolean;
  dueInDays: number;
  active: boolean;
}

export interface EnrollmentView {
  id: string;
  course: CourseView;
  status: EnrollmentStatus;
  dueAt: string | null;
  overdue: boolean;
  startedAt: string | null;
  completedAt: string | null;
  certificateNo: string | null;
  assignedByName: string | null;
}

export interface ComplianceRow {
  course: CourseView;
  assigned: number;
  completed: number;
  overdue: number;
}

export interface LearningOverview {
  mine: EnrollmentView[];
  catalogue: CourseView[];
  /** HR and admins only. */
  compliance: ComplianceRow[] | null;
}
