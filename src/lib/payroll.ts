/** Shared between the payroll API and UI. Safe to import on the client. */
export type ComponentType = 'earning' | 'deduction';
export type PayRunStatus = 'draft' | 'published';

export interface PayComponent {
  name: string;
  type: ComponentType;
  /** A fixed monthly amount. Tax and statutory amounts are entered by HR; nothing is calculated for a country. */
  amount: number;
}

export interface PayStructureView {
  employee: { id: string; name: string; department: string; jobTitle: string };
  currency: string;
  components: PayComponent[];
  gross: number;
  deductions: number;
  net: number;
  updatedAt: string | null;
}

export interface PayslipLine {
  name: string;
  type: ComponentType;
  amount: number;
}

export interface PayslipView {
  id: string;
  month: string; // yyyy-MM
  employee: { id: string; name: string; department: string; jobTitle: string };
  currency: string;
  lines: PayslipLine[];
  /** Working days in the month, and unpaid leave days deducted. */
  workingDays: number;
  unpaidDays: number;
  gross: number;
  deductions: number;
  net: number;
  status: PayRunStatus;
  publishedAt: string | null;
}

export interface PayRunView {
  id: string;
  month: string;
  status: PayRunStatus;
  currency: string;
  employees: number;
  gross: number;
  deductions: number;
  net: number;
  createdAt: string;
  publishedAt: string | null;
}

export const COMPONENT_PRESETS: PayComponent[] = [
  { name: 'Basic salary', type: 'earning', amount: 0 },
  { name: 'House rent allowance', type: 'earning', amount: 0 },
  { name: 'Other allowance', type: 'earning', amount: 0 },
  { name: 'Retirement contribution', type: 'deduction', amount: 0 },
  { name: 'Income tax (as advised)', type: 'deduction', amount: 0 },
];

export const totals = (lines: { type: ComponentType; amount: number }[]) => {
  const gross = lines.filter((l) => l.type === 'earning').reduce((t, l) => t + l.amount, 0);
  const deductions = lines.filter((l) => l.type === 'deduction').reduce((t, l) => t + l.amount, 0);
  return { gross: round(gross), deductions: round(deductions), net: round(gross - deductions) };
};
export const round = (n: number) => Math.round(n * 100) / 100;
