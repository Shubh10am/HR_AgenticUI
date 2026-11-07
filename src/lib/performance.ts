/** Shared between the performance API and UI. Safe to import on the client. */
export type GoalStatus = 'on-track' | 'at-risk' | 'off-track' | 'done';
export const GOAL_STATUS_META: Record<GoalStatus, { label: string; tone: string }> = {
  'on-track': { label: 'On track', tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  'at-risk': { label: 'At risk', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
  'off-track': { label: 'Off track', tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
  done: { label: 'Done', tone: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300' },
};

export interface KeyResultView {
  id: string;
  title: string;
  start: number;
  target: number;
  current: number;
  unit: string;
  progress: number;
}

export interface GoalView {
  id: string;
  owner: { id: string; name: string; department: string };
  title: string;
  description: string;
  parentId: string | null;
  parentTitle: string | null;
  dueDate: string | null;
  status: GoalStatus;
  progress: number;
  keyResults: KeyResultView[];
  canEdit: boolean;
  updatedAt: string;
}

export type ReviewType = 'self' | 'manager';
export type CycleStatus = 'draft' | 'active' | 'closed';

export interface ReviewQuestion {
  key: string;
  text: string;
  kind: 'rating' | 'text';
}

export const DEFAULT_REVIEW_QUESTIONS: ReviewQuestion[] = [
  { key: 'achievements', text: 'What were the most important things achieved this period?', kind: 'text' },
  { key: 'goals', text: 'How well were the goals for this period met?', kind: 'rating' },
  { key: 'collaboration', text: 'How effective was collaboration with the team and other teams?', kind: 'rating' },
  { key: 'growth', text: 'What should be the focus for growth next period?', kind: 'text' },
];

export const RATING_LABELS = ['Needs support', 'Developing', 'Meets expectations', 'Exceeds expectations', 'Outstanding'];

export interface CycleView {
  id: string;
  name: string;
  dueAt: string;
  status: CycleStatus;
  questions: ReviewQuestion[];
  total: number;
  submitted: number;
  createdAt: string;
}

export interface ReviewView {
  id: string;
  cycle: { id: string; name: string; status: CycleStatus; dueAt: string };
  subject: { id: string; name: string; department: string };
  reviewer: { id: string; name: string } | null;
  type: ReviewType;
  status: 'pending' | 'submitted';
  answers: { key: string; rating: number | null; text: string }[];
  questions: ReviewQuestion[];
  submittedAt: string | null;
  canWrite: boolean;
}

export const progressOf = (kr: { start: number; target: number; current: number }) =>
  kr.target === kr.start ? (kr.current >= kr.target ? 100 : 0) : Math.max(0, Math.min(100, Math.round(((kr.current - kr.start) / (kr.target - kr.start)) * 100)));
