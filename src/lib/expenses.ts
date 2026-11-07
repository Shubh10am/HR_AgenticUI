import type { ApprovalView } from './approvals';

/** Shared between the expenses API and UI. Safe to import on the client. */
export const EXPENSE_CATEGORIES = ['Travel', 'Meals', 'Accommodation', 'Software', 'Equipment', 'Training', 'Internet & phone', 'Other'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;
export type ExpenseStatus = 'submitted' | 'approved' | 'rejected' | 'paid' | 'withdrawn';

export const EXPENSE_STATUS_LABEL: Record<ExpenseStatus, string> = {
  submitted: 'Awaiting approval',
  approved: 'Approved · to be paid',
  rejected: 'Rejected',
  paid: 'Paid',
  withdrawn: 'Withdrawn',
};

/** Receipts are kept small: images or PDFs up to 1.5 MB. */
export const RECEIPT_MAX_BYTES = 1.5 * 1024 * 1024;
export const RECEIPT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

export interface ExpenseView {
  id: string;
  employee: { id: string; name: string; department: string };
  category: ExpenseCategory;
  merchant: string;
  description: string;
  amount: number;
  currency: string;
  spentOn: string;
  status: ExpenseStatus;
  hasReceipt: boolean;
  paidAt: string | null;
  approval: ApprovalView | null;
  mine: boolean;
  createdAt: string;
}

export interface NewExpenseInput {
  category: ExpenseCategory;
  merchant: string;
  description?: string;
  amount: number;
  currency: string;
  spentOn: string;
  receipt?: { name: string; type: string; dataUrl: string } | null;
}

export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
