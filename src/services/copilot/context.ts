import Employee from '@/models/Employee';
import ApprovalRequest from '@/models/ApprovalRequest';
import OneOnOne from '@/models/OneOnOne';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';
import RewardTxn from '@/models/RewardTxn';
import AppAccess from '@/models/AppAccess';
import Payslip from '@/models/Payslip';
import PayRun from '@/models/PayRun';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import type { Viewer } from '@/lib/api-route';
import { balancesFor } from '@/services/leave';
import { approvalInbox } from '@/services/approvals';

const day = (d: Date) => d.toISOString().slice(0, 10);

/**
 * A short, factual summary of the signed-in person's own HR records for Copilot.
 * Only their own data is included — never colleagues' records, leave types or pay amounts.
 *
 * @returns Plain-text lines, or an empty string when the viewer can't be found.
 */
export async function myHrSnapshot(userId: string, organizationId: string): Promise<string> {
  await dbConnect();
  const me = await Employee.findOne({ _id: userId, organizationId }).select('name role department jobTitle').lean();
  if (!me) return '';
  const viewer: Viewer = { id: userId, organizationId, role: me.role, name: me.name };
  const now = new Date();
  const [balances, inbox, meetings, courses, points, apps, lastSlip] = await Promise.all([
    balancesFor(organizationId, userId, now.getUTCFullYear()).catch(() => []),
    approvalInbox(viewer).catch(() => ({ waiting: [], mine: [], decided: [], open: [] })),
    OneOnOne.find({ $or: [{ manager: userId }, { report: userId }], status: 'scheduled', scheduledFor: { $gte: now } }).sort({ scheduledFor: 1 }).limit(3).lean(),
    Enrollment.find({ employee: userId, status: { $ne: 'completed' } }).sort({ dueAt: 1 }).limit(5).lean(),
    RewardTxn.aggregate([{ $match: { employee: new mongoose.Types.ObjectId(userId) } }, { $group: { _id: null, total: { $sum: '$points' } } }]),
    AppAccess.find({ employee: userId, status: { $in: ['pending-approval', 'to-grant'] } }).countDocuments(),
    PayRun.find({ organizationId, status: 'published' }).sort({ month: -1 }).limit(1).lean().then(async ([run]) => (run && (await Payslip.exists({ run: run._id, employee: userId })) ? run.month : null)),
  ]);
  const people = new Map((await Employee.find({ _id: { $in: meetings.flatMap((m) => [m.manager, m.report]) } }).select('name').lean()).map((p) => [String(p._id), p.name]));
  const courseNames = new Map((await Course.find({ _id: { $in: courses.map((c) => c.course) } }).select('title mandatory').lean()).map((c) => [String(c._id), c]));

  const lines = [
    `Name: ${me.name}. Role: ${me.role}.${me.jobTitle ? ` Job title: ${me.jobTitle}.` : ''}${me.department ? ` Department: ${me.department}.` : ''} Today: ${day(now)}.`,
    `Leave left this year: ${balances.filter((b) => b.tracked).map((b) => `${b.type} ${b.available} days${b.pending ? ` (${b.pending} pending)` : ''}`).join('; ') || 'not set up'}. Page: /leave.`,
    `Requests waiting on me to approve: ${inbox.waiting.length}${inbox.waiting.length ? ` (${inbox.waiting.slice(0, 5).map((w) => w.title).join('; ')})` : ''}. Page: /approvals.`,
    `My own open requests: ${inbox.mine.filter((m) => m.status === 'pending').length}. Page: /approvals.`,
    `Upcoming 1:1s: ${meetings.map((m) => `${day(new Date(m.scheduledFor))} with ${people.get(String(String(m.manager) === userId ? m.report : m.manager))}`).join('; ') || 'none booked'}. Page: /one-on-ones.`,
    `Unfinished courses: ${courses.map((c) => { const course = courseNames.get(String(c.course)); return course ? `${course.title}${course.mandatory ? ' (mandatory)' : ''}${c.dueAt ? `, due ${day(new Date(c.dueAt))}${new Date(c.dueAt) < now ? ' — OVERDUE' : ''}` : ''}` : null; }).filter(Boolean).join('; ') || 'none'}. Page: /learning.`,
    `Reward points: ${points[0]?.total ?? 0}. Page: /rewards.`,
    `App access requests in progress: ${apps}. Page: /apps.`,
    `Latest payslip: ${lastSlip ?? 'none published yet'}. Page: /payroll.`,
  ];
  return lines.join('\n');
}
