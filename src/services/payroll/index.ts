import mongoose from 'mongoose';
import PayStructure from '@/models/PayStructure';
import PayRun from '@/models/PayRun';
import Payslip from '@/models/Payslip';
import Employee from '@/models/Employee';
import LeaveRequest from '@/models/LeaveRequest';
import { ApiError, requireRole, type Viewer } from '@/lib/api-route';
import { workingDays } from '@/services/leave';
import { round, totals, type PayComponent, type PayRunView, type PayslipView, type PayStructureView } from '@/lib/payroll';

const PEOPLE = ['Admin', 'HR'];
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const CURRENCY = /^[A-Z]{3}$/;

const monthRange = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
};

const personOf = (p: any) => ({ id: String(p._id), name: p.name, department: p.department ?? '', jobTitle: p.jobTitle ?? '' });

/** Every person with their pay structure (HR and admins). People without one show empty. */
export async function listStructures(viewer: Viewer): Promise<PayStructureView[]> {
  requireRole(viewer, PEOPLE, 'Only HR and admins manage pay.');
  const [people, structures] = await Promise.all([
    Employee.find({ organizationId: viewer.organizationId }).select('name department jobTitle').sort({ name: 1 }).lean(),
    PayStructure.find({ organizationId: viewer.organizationId }).lean(),
  ]);
  const byEmployee = new Map(structures.map((s) => [String(s.employee), s]));
  return people.map((person) => {
    const s = byEmployee.get(String(person._id));
    const components = s?.components ?? [];
    return { employee: personOf(person), currency: s?.currency ?? 'INR', components, ...totals(components), updatedAt: s ? new Date(s.updatedAt).toISOString() : null };
  });
}

/** Saves one person's monthly components. Amounts are fixed; nothing is calculated for any country’s tax rules. */
export async function saveStructure(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, PEOPLE, 'Only HR and admins manage pay.');
  const employeeId = String(input.employeeId ?? '');
  if (!mongoose.isValidObjectId(employeeId) || !(await Employee.exists({ _id: employeeId, organizationId: viewer.organizationId }))) throw new ApiError('Choose a person in your organisation.');
  const currency = String(input.currency ?? 'INR').toUpperCase();
  if (!CURRENCY.test(currency)) throw new ApiError('Use a three-letter currency code, like INR or USD.');
  if (!Array.isArray(input.components) || input.components.length > 20) throw new ApiError('Add up to 20 pay components.');
  const components: PayComponent[] = (input.components as Partial<PayComponent>[]).map((c) => {
    const name = String(c?.name ?? '').trim().slice(0, 60);
    const amount = round(Number(c?.amount));
    if (!name) throw new ApiError('Every component needs a name.');
    if (c?.type !== 'earning' && c?.type !== 'deduction') throw new ApiError('Each component is an earning or a deduction.');
    if (!Number.isFinite(amount) || amount < 0 || amount > 100_000_000) throw new ApiError(`Enter a valid amount for ${name}.`);
    return { name, type: c.type, amount };
  });
  if (totals(components).net < 0) throw new ApiError('Deductions can’t be more than earnings.');
  await PayStructure.updateOne({ employee: employeeId }, { $set: { organizationId: viewer.organizationId, currency, components, updatedBy: viewer.id } }, { upsert: true });
  return listStructures(viewer);
}

/** Approved unpaid leave days inside the month, counting working days only. */
async function unpaidDaysIn(organizationId: string, employeeId: unknown, from: string, to: string) {
  const leaves = await LeaveRequest.find({ employeeId, status: 'Approved', leaveType: 'Unpaid', startDate: { $lte: new Date(`${to}T23:59:59Z`) }, endDate: { $gte: new Date(`${from}T00:00:00Z`) } }).select('startDate endDate').lean();
  let days = 0;
  for (const leave of leaves) {
    const start = new Date(leave.startDate).toISOString().slice(0, 10);
    const end = new Date(leave.endDate).toISOString().slice(0, 10);
    days += await workingDays(organizationId, start > from ? start : from, end < to ? end : to);
  }
  return days;
}

const slipView = (slip: any, run: { status: string; publishedAt?: Date | null }): PayslipView => ({
  id: String(slip._id),
  month: slip.month,
  employee: { id: String(slip.employee), name: slip.name, department: slip.department ?? '', jobTitle: slip.jobTitle ?? '' },
  currency: slip.currency,
  lines: slip.lines,
  workingDays: slip.workingDays,
  unpaidDays: slip.unpaidDays,
  ...totals(slip.lines),
  status: run.status as PayslipView['status'],
  publishedAt: run.publishedAt ? new Date(run.publishedAt).toISOString() : null,
});

async function runView(run: any): Promise<PayRunView> {
  const slips = await Payslip.find({ run: run._id }).select('lines').lean();
  const sum = slips.reduce((acc, s) => { const t = totals(s.lines); return { gross: acc.gross + t.gross, deductions: acc.deductions + t.deductions, net: acc.net + t.net }; }, { gross: 0, deductions: 0, net: 0 });
  return { id: String(run._id), month: run.month, status: run.status, currency: run.currency, employees: slips.length, gross: round(sum.gross), deductions: round(sum.deductions), net: round(sum.net), createdAt: new Date(run.createdAt).toISOString(), publishedAt: run.publishedAt ? new Date(run.publishedAt).toISOString() : null };
}

export async function listRuns(viewer: Viewer): Promise<PayRunView[]> {
  requireRole(viewer, PEOPLE, 'Only HR and admins run payroll.');
  const runs = await PayRun.find({ organizationId: viewer.organizationId }).sort({ month: -1 }).limit(36).lean();
  return Promise.all(runs.map(runView));
}

/**
 * Prepares a month’s payslips from everyone’s pay structure. Earnings are reduced for approved
 * unpaid leave (earnings × paid days ÷ working days). Running it again on a draft rebuilds it.
 */
export async function prepareRun(viewer: Viewer, input: Record<string, unknown>): Promise<PayRunView> {
  requireRole(viewer, PEOPLE, 'Only HR and admins run payroll.');
  const month = String(input.month ?? '');
  if (!MONTH.test(month)) throw new ApiError('Choose a month.');
  const prorate = input.prorateUnpaid !== false;
  const existing = await PayRun.findOne({ organizationId: viewer.organizationId, month });
  if (existing?.status === 'published') throw new ApiError('That month is already published.');
  const structures = await PayStructure.find({ organizationId: viewer.organizationId, 'components.0': { $exists: true } }).lean();
  if (!structures.length) throw new ApiError('Set up at least one person’s pay before running payroll.');
  const currency = structures[0].currency;
  const run = existing ?? (await PayRun.create({ organizationId: viewer.organizationId, month, currency, createdBy: viewer.id }));
  await Payslip.deleteMany({ run: run._id });
  const { from, to } = monthRange(month);
  const working = await workingDays(viewer.organizationId, from, to);
  const people = new Map((await Employee.find({ _id: { $in: structures.map((s) => s.employee) } }).select('name department jobTitle').lean()).map((p) => [String(p._id), p]));
  const slips = [];
  for (const s of structures) {
    const person = people.get(String(s.employee));
    if (!person) continue;
    const unpaid = prorate ? Math.min(await unpaidDaysIn(viewer.organizationId, s.employee, from, to), working) : 0;
    const factor = working ? (working - unpaid) / working : 1;
    const lines = s.components.map((c) => ({ name: c.name, type: c.type, amount: c.type === 'earning' ? round(c.amount * factor) : c.amount }));
    slips.push({ organizationId: viewer.organizationId, run: run._id, month, employee: s.employee, currency: s.currency, lines, workingDays: working, unpaidDays: unpaid, name: person.name, department: person.department ?? '', jobTitle: person.jobTitle ?? '' });
  }
  await Payslip.insertMany(slips);
  return runView(await PayRun.findById(run._id).lean());
}

async function ownedRun(viewer: Viewer, id: unknown) {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown pay run.');
  const run = await PayRun.findOne({ _id: id, organizationId: viewer.organizationId });
  if (!run) throw new ApiError('Pay run not found.', 404);
  return run;
}

/** All payslips in a run, for HR to check before publishing. */
export async function runPayslips(viewer: Viewer, id: unknown): Promise<PayslipView[]> {
  requireRole(viewer, PEOPLE, 'Only HR and admins run payroll.');
  const run = await ownedRun(viewer, id);
  return (await Payslip.find({ run: run._id }).sort({ name: 1 }).lean()).map((s) => slipView(s, run));
}

/** Publishes a run so each person can see their payslip. A published run can’t be changed. */
export async function publishRun(viewer: Viewer, id: unknown): Promise<PayRunView> {
  requireRole(viewer, PEOPLE, 'Only HR and admins run payroll.');
  const run = await ownedRun(viewer, id);
  if (run.status === 'published') throw new ApiError('Already published.');
  run.status = 'published';
  run.publishedAt = new Date();
  await run.save();
  return runView(run.toObject());
}

export async function deleteDraft(viewer: Viewer, id: unknown) {
  requireRole(viewer, PEOPLE, 'Only HR and admins run payroll.');
  const run = await ownedRun(viewer, id);
  if (run.status === 'published') throw new ApiError('Published runs are kept as a record.');
  await Payslip.deleteMany({ run: run._id });
  await run.deleteOne();
  return listRuns(viewer);
}

/** The viewer’s own published payslips. */
export async function myPayslips(viewer: Viewer): Promise<PayslipView[]> {
  const runs = await PayRun.find({ organizationId: viewer.organizationId, status: 'published' }).lean();
  const byId = new Map(runs.map((r) => [String(r._id), r]));
  const slips = await Payslip.find({ employee: viewer.id, run: { $in: runs.map((r) => r._id) } }).sort({ month: -1 }).lean();
  return slips.map((s) => slipView(s, byId.get(String(s.run))!));
}
