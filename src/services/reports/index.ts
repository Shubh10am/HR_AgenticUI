import mongoose from 'mongoose';
import Employee from '@/models/Employee';
import Offboarding from '@/models/Offboarding';
import LeaveRequest from '@/models/LeaveRequest';
import Expense from '@/models/Expense';
import ApprovalRequest from '@/models/ApprovalRequest';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import { requireRole, type Viewer } from '@/lib/api-route';
import { workingDays } from '@/services/leave';
import { MIN_GROUP, type MonthPoint, type PeopleReport } from '@/lib/reports';

const monthKey = (date: Date) => date.toISOString().slice(0, 7);
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/** Folds rows below the privacy threshold into one "Other" row, so small groups can't be singled out. */
function foldSmall<T extends { count: number }>(rows: T[], labelKey: keyof T, min = MIN_GROUP): T[] {
  const big = rows.filter((row) => row.count >= min);
  const small = rows.filter((row) => row.count < min).reduce((total, row) => total + row.count, 0);
  return small ? [...big, { [labelKey]: 'Other', count: small } as unknown as T] : big;
}

/**
 * Organisation-wide people numbers for HR and admins. Everything is a count or a total;
 * no individual appears, and groups smaller than MIN_GROUP are folded into "Other".
 */
export async function peopleReport(viewer: Viewer): Promise<PeopleReport> {
  requireRole(viewer, ['Admin', 'HR'], 'Reports are for HR and admins.');
  const org = new mongoose.Types.ObjectId(viewer.organizationId);
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const twelveAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [people, exits, leaves, expenses, open, mandatory] = await Promise.all([
    Employee.find({ organizationId: org }).select('department role joinedAt createdAt').lean(),
    Offboarding.find({ organizationId: org, status: 'completed', lastWorkingDay: { $gte: twelveAgo } }).select('reason lastWorkingDay').lean(),
    LeaveRequest.find({ organizationId: org, status: 'Approved', startDate: { $gte: yearStart } }).select('leaveType startDate endDate employeeId').lean(),
    Expense.find({ organizationId: org, status: { $in: ['approved', 'paid'] }, createdAt: { $gte: yearStart } }).select('category amount currency').lean(),
    ApprovalRequest.find({ organizationId: org, status: 'pending' }).select('createdAt').lean(),
    Course.find({ organizationId: org, mandatory: true, active: true }).distinct('_id'),
  ]);

  const count = (values: string[]) => [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<string, number>())].map(([label, n]) => ({ label, count: n })).sort((a, b) => b.count - a.count);

  const months: MonthPoint[] = Array.from({ length: 12 }, (_, i) => ({ month: monthKey(new Date(Date.UTC(twelveAgo.getFullYear(), twelveAgo.getMonth() + i, 1))), joiners: 0, leavers: 0 }));
  const byMonth = new Map(months.map((point) => [point.month, point]));
  for (const person of people) {
    const joined = person.joinedAt ?? person.createdAt;
    const point = joined ? byMonth.get(monthKey(new Date(joined))) : undefined;
    if (point) point.joiners++;
  }
  for (const exit of exits) {
    const point = byMonth.get(monthKey(new Date(exit.lastWorkingDay)));
    if (point) point.leavers++;
  }
  const averageHeadcount = people.length + exits.length / 2;

  const leaveByType = new Map<string, { days: number; people: Set<string> }>();
  let leaveDays = 0;
  for (const leave of leaves) {
    const days = await workingDays(viewer.organizationId, dayKey(new Date(leave.startDate)), dayKey(new Date(leave.endDate)));
    leaveDays += days;
    const entry = leaveByType.get(leave.leaveType) ?? { days: 0, people: new Set<string>() };
    entry.days += days;
    entry.people.add(String(leave.employeeId));
    leaveByType.set(leave.leaveType, entry);
  }
  // A leave type taken by fewer than MIN_GROUP people is folded, so nobody's sick leave stands out.
  const typeRows = [...leaveByType].map(([type, value]) => ({ type, days: value.days, count: value.people.size }));
  const shownTypes = typeRows.filter((row) => row.count >= MIN_GROUP).map(({ type, days }) => ({ type, days }));
  const otherDays = typeRows.filter((row) => row.count < MIN_GROUP).reduce((total, row) => total + row.days, 0);

  const currency = expenses[0]?.currency ?? 'INR';
  const spend = new Map<string, number>();
  for (const expense of expenses.filter((item) => item.currency === currency)) spend.set(expense.category, (spend.get(expense.category) ?? 0) + expense.amount);

  let mandatoryCompletion: number | null = null;
  if (mandatory.length) {
    const [assigned, done] = await Promise.all([Enrollment.countDocuments({ course: { $in: mandatory } }), Enrollment.countDocuments({ course: { $in: mandatory }, status: 'completed' })]);
    mandatoryCompletion = assigned ? Math.round((done / assigned) * 100) : null;
  }

  return {
    generatedAt: now.toISOString(),
    headcount: people.length,
    byDepartment: count(people.map((p) => p.department || 'Unassigned')).map(({ label, count: n }) => ({ department: label, count: n })),
    byRole: count(people.map((p) => p.role)).map(({ label, count: n }) => ({ role: label, count: n })),
    monthly: months,
    attritionRate: averageHeadcount ? Math.round((exits.length / averageHeadcount) * 1000) / 10 : 0,
    leaversLast12: exits.length,
    exitReasons: foldSmall(count(exits.map((e) => e.reason)).map(({ label, count: n }) => ({ reason: label, count: n })), 'reason', 2),
    absence: {
      leaveDaysThisYear: leaveDays,
      averagePerPerson: people.length ? Math.round((leaveDays / people.length) * 10) / 10 : 0,
      byType: [...shownTypes, ...(otherDays ? [{ type: 'Other', days: otherDays }] : [])].sort((a, b) => b.days - a.days),
    },
    expenses: { approvedThisYear: [...spend.values()].reduce((a, b) => a + b, 0), currency, byCategory: [...spend].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount) },
    approvals: { open: open.length, oldestDays: open.length ? Math.floor((now.getTime() - Math.min(...open.map((o) => new Date(o.createdAt).getTime()))) / 86_400_000) : 0 },
    learning: { mandatoryCompletion },
  };
}
