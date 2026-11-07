import mongoose from 'mongoose';
import Expense from '@/models/Expense';
import Employee from '@/models/Employee';
import ApprovalRequest from '@/models/ApprovalRequest';
import { ApiError, isPeopleTeam, type Viewer } from '@/lib/api-route';
import { approvalsForSubjects, cancelApproval, startApproval } from '@/services/approvals';
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  RECEIPT_MAX_BYTES,
  RECEIPT_TYPES,
  formatMoney,
  type ExpenseStatus,
  type ExpenseView,
  type NewExpenseInput,
} from '@/lib/expenses';

const MAX_AGE_DAYS = 180;

async function toViews(viewer: Viewer, expenses: any[]): Promise<ExpenseView[]> {
  const people = await Employee.find({ _id: { $in: expenses.map((expense) => expense.employee) } }).select('name department').lean();
  const byId = new Map(people.map((person) => [String(person._id), person]));
  const approvals = await approvalsForSubjects(viewer, expenses.map((expense) => String(expense._id)));
  return expenses.map((expense) => {
    const person = byId.get(String(expense.employee));
    return {
      id: String(expense._id),
      employee: { id: String(expense.employee), name: person?.name ?? 'Former colleague', department: person?.department ?? '' },
      category: expense.category,
      merchant: expense.merchant,
      description: expense.description ?? '',
      amount: expense.amount,
      currency: expense.currency,
      spentOn: new Date(expense.spentOn).toISOString(),
      status: expense.status,
      hasReceipt: !!expense.hasReceipt,
      paidAt: expense.paidAt ? new Date(expense.paidAt).toISOString() : null,
      approval: approvals.get(String(expense._id)) ?? null,
      mine: String(expense.employee) === viewer.id,
      createdAt: new Date(expense.createdAt).toISOString(),
    };
  });
}

/**
 * Lists claims. Everyone sees their own; `scope=team` shows their direct reports' claims;
 * `scope=all` (HR and admins) shows the whole organisation.
 */
export async function listExpenses(viewer: Viewer, scope: unknown): Promise<ExpenseView[]> {
  let filter: Record<string, unknown> = { organizationId: viewer.organizationId, employee: viewer.id };
  if (scope === 'all') {
    if (!isPeopleTeam(viewer.role)) throw new ApiError('Only HR and admins can see every claim.', 403);
    filter = { organizationId: viewer.organizationId };
  } else if (scope === 'team') {
    const reports = await Employee.find({ organizationId: viewer.organizationId, managerId: viewer.id }).distinct('_id');
    filter = { organizationId: viewer.organizationId, employee: { $in: reports } };
  }
  const expenses = await Expense.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return toViews(viewer, expenses);
}

function parseReceipt(receipt: NewExpenseInput['receipt']) {
  if (!receipt) return null;
  const match = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(receipt.dataUrl ?? '');
  if (!match || !RECEIPT_TYPES.includes(match[1])) throw new ApiError('Receipts must be a PNG, JPEG, WebP or PDF file.');
  if ((match[2].length * 3) / 4 > RECEIPT_MAX_BYTES) throw new ApiError('Receipts can be up to 1.5 MB.');
  return { name: String(receipt.name ?? 'receipt').slice(0, 120), type: match[1], data: receipt.dataUrl };
}

/** Records a claim and sends it for approval. */
export async function submitExpense(viewer: Viewer, input: Partial<NewExpenseInput>): Promise<ExpenseView> {
  if (!EXPENSE_CATEGORIES.includes(input.category as never)) throw new ApiError('Choose a category.');
  if (!CURRENCIES.includes(input.currency as never)) throw new ApiError('Choose a currency.');
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) throw new ApiError('Enter an amount greater than zero.');
  const merchant = String(input.merchant ?? '').trim().slice(0, 80);
  if (!merchant) throw new ApiError('Add where the money was spent.');
  const spentOn = new Date(String(input.spentOn ?? ''));
  if (Number.isNaN(spentOn.getTime())) throw new ApiError('Choose the date of the expense.');
  if (spentOn.getTime() > Date.now() + 86_400_000) throw new ApiError('The expense date is in the future.');
  if (Date.now() - spentOn.getTime() > MAX_AGE_DAYS * 86_400_000) throw new ApiError(`Claims must be submitted within ${MAX_AGE_DAYS} days.`);
  const receipt = parseReceipt(input.receipt);

  const expense = await Expense.create({
    organizationId: viewer.organizationId,
    employee: viewer.id,
    category: input.category,
    merchant,
    description: String(input.description ?? '').trim().slice(0, 500),
    amount,
    currency: input.currency,
    spentOn,
    receipt,
    hasReceipt: !!receipt,
    status: 'submitted',
  });
  await startApproval({
    viewer,
    kind: 'expense',
    subjectId: expense._id as mongoose.Types.ObjectId,
    title: `${input.category} · ${merchant}`,
    summary: `${formatMoney(amount, input.currency!)} on ${spentOn.toISOString().slice(0, 10)}${expense.description ? ` — ${expense.description}` : ''}`,
    amount,
    currency: input.currency,
  });
  return (await toViews(viewer, [(await Expense.findById(expense._id).lean())!]))[0];
}

/** Called by the approval engine once a claim's chain finishes. */
export async function onExpenseSettled(expenseId: string, outcome: 'approved' | 'rejected' | 'cancelled') {
  const status: ExpenseStatus = outcome === 'approved' ? 'approved' : outcome === 'rejected' ? 'rejected' : 'withdrawn';
  await Expense.updateOne({ _id: expenseId, status: 'submitted' }, { $set: { status } });
}

async function loadVisible(viewer: Viewer, id: unknown, withReceipt = false) {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown claim.');
  const query = Expense.findOne({ _id: id, organizationId: viewer.organizationId });
  const expense = await (withReceipt ? query.select('+receipt') : query);
  if (!expense) throw new ApiError('Claim not found.', 404);
  const own = String(expense.employee) === viewer.id;
  if (!own && !isPeopleTeam(viewer.role)) {
    const approver = await ApprovalRequest.exists({ subjectId: expense._id, $or: [{ 'steps.assignee': viewer.id }, { 'steps.decidedBy': viewer.id }] });
    const manager = await Employee.exists({ _id: expense.employee, managerId: viewer.id });
    if (!approver && !manager) throw new ApiError('Claim not found.', 404);
  }
  return { expense, own };
}

/** The receipt file, for the claimant, their manager and approvers, HR and admins. */
export async function expenseReceipt(viewer: Viewer, id: unknown) {
  const { expense } = await loadVisible(viewer, id, true);
  if (!expense.receipt) throw new ApiError('This claim has no receipt.', 404);
  return expense.receipt;
}

/** Withdraws a claim that is still awaiting approval. */
export async function withdrawExpense(viewer: Viewer, id: unknown) {
  const { expense, own } = await loadVisible(viewer, id);
  if (!own) throw new ApiError('Only the claimant can withdraw a claim.', 403);
  if (expense.status !== 'submitted') throw new ApiError('Only claims awaiting approval can be withdrawn.');
  expense.status = 'withdrawn';
  await expense.save();
  await cancelApproval(viewer, String(expense._id));
  return { ok: true };
}

/** Marks approved claims as reimbursed (HR and admins). */
export async function markPaid(viewer: Viewer, ids: unknown) {
  if (!isPeopleTeam(viewer.role)) throw new ApiError('Only HR and admins can mark claims as paid.', 403);
  const list = (Array.isArray(ids) ? ids : [ids]).filter((id): id is string => typeof id === 'string' && mongoose.isValidObjectId(id));
  if (list.length === 0) throw new ApiError('Choose at least one claim.');
  const result = await Expense.updateMany(
    { _id: { $in: list }, organizationId: viewer.organizationId, status: 'approved' },
    { $set: { status: 'paid', paidAt: new Date(), paidBy: viewer.id } }
  );
  return { updated: result.modifiedCount };
}
