import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import TokenUsageLog from '@/models/TokenUsageLog';
import SupportTicket from '@/models/SupportTicket';
import ContactSubmission from '@/models/ContactSubmission';
import DemoRequest from '@/models/DemoRequest';
import AuditLog from '@/models/AuditLog';
import { subDays } from 'date-fns';

/** Readable names for the AI flows recorded in TokenUsageLog.feature. */
const FEATURE_LABELS: Record<string, string> = {
  aiInterviewerFlow: 'AI Interviewer',
  analyzeResumeFlow: 'Resume Analysis',
  copilotChatFlow: 'Copilot Chat',
  generateDraftEmailResponsesFlow: 'Email Drafting',
  generateJobDescriptionFlow: 'Job Descriptions',
  knowledgeAnswer: 'Knowledge Base Answers',
  summarizeGithubActivityFlow: 'GitHub Summaries',
};

export interface MetricWithChange {
  value: number;
  previous: number | null;
}

export interface PlatformMetrics {
  periodDays: number | null;
  kpis: {
    organizations: MetricWithChange;
    activeOrganizations: number;
    users: MetricWithChange;
    newUsers: MetricWithChange;
    aiTokens: MetricWithChange;
    aiRequests: MetricWithChange;
    actions: MetricWithChange;
    failedActions: MetricWithChange;
    openTickets: number;
    newInquiries: MetricWithChange;
  };
  activityOverTime: { date: string; aiRequests: number; actions: number; failures: number }[];
  signupsOverTime: { date: string; signups: number }[];
  featureUsage: { name: string; requests: number; tokens: number }[];
  topOrganizations: { id: string; name: string; tokens: number; requests: number }[];
  organizationStatus: { status: string; count: number }[];
  recentActivity: { id: string; action: string; actorName: string; actorEmail: string; organization: string; outcome: string; createdAt: string }[];
}

type Range = { $gte?: Date; $lt?: Date };

function dayKey(field: string) {
  return { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } };
}

async function countIn(model: { countDocuments: (filter: object) => Promise<number> }, range: Range | null, extra: object = {}) {
  return model.countDocuments(range ? { ...extra, createdAt: range } : extra);
}

async function tokenTotals(range: Range | null) {
  const [row] = await TokenUsageLog.aggregate([
    ...(range ? [{ $match: { createdAt: range } }] : []),
    { $group: { _id: null, tokens: { $sum: '$totalTokens' }, requests: { $sum: 1 } } },
  ]);
  return { tokens: row?.tokens ?? 0, requests: row?.requests ?? 0 };
}

/** Fills missing days with zeros so charts show gaps as zero rather than skipping them. */
function fillDays<T extends { date: string }>(rows: T[], start: Date, end: Date, empty: Omit<T, 'date'>): T[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const filled: T[] = [];
  for (let day = new Date(start); day <= end; day = new Date(day.getTime() + 86_400_000)) {
    const key = day.toISOString().slice(0, 10);
    filled.push(byDate.get(key) ?? ({ date: key, ...empty } as T));
  }
  return filled;
}

/**
 * Platform-wide metrics for the admin dashboard and analytics pages.
 *
 * @param periodDays - Window to report on; null for all time (no comparison is made then).
 */
export async function getPlatformMetrics(periodDays: number | null): Promise<PlatformMetrics> {
  const now = new Date();
  const start = periodDays ? subDays(now, periodDays) : null;
  const current: Range | null = start ? { $gte: start } : null;
  const previous: Range | null = start && periodDays ? { $gte: subDays(start, periodDays), $lt: start } : null;
  // Charts need a bounded window even for "all time".
  const chartStart = start ?? subDays(now, 90);

  const [
    organizations, organizationsBefore, activeOrganizations, users, usersBefore,
    newUsers, newUsersPrev, tokensNow, tokensPrev, actions, actionsPrev, failed, failedPrev,
    openTickets, contacts, contactsPrev, demos, demosPrev,
  ] = await Promise.all([
    Organization.countDocuments(),
    start ? Organization.countDocuments({ createdAt: { $lt: start } }) : Promise.resolve(null),
    Organization.countDocuments({ status: 'Active' }),
    Employee.countDocuments(),
    start ? Employee.countDocuments({ createdAt: { $lt: start } }) : Promise.resolve(null),
    countIn(Employee, current),
    previous ? countIn(Employee, previous) : Promise.resolve(null),
    tokenTotals(current),
    previous ? tokenTotals(previous) : Promise.resolve(null),
    countIn(AuditLog, current),
    previous ? countIn(AuditLog, previous) : Promise.resolve(null),
    countIn(AuditLog, current, { outcome: 'failure' }),
    previous ? countIn(AuditLog, previous, { outcome: 'failure' }) : Promise.resolve(null),
    SupportTicket.countDocuments({ status: { $in: ['Open', 'In Progress'] } }),
    countIn(ContactSubmission, current),
    previous ? countIn(ContactSubmission, previous) : Promise.resolve(null),
    countIn(DemoRequest, current),
    previous ? countIn(DemoRequest, previous) : Promise.resolve(null),
  ]);

  const chartRange = { $gte: chartStart };
  const [aiByDay, actionsByDay, signupsByDay, features, topOrgs, orgStatus, recent] = await Promise.all([
    TokenUsageLog.aggregate([
      { $match: { createdAt: chartRange } },
      { $group: { _id: dayKey('createdAt'), aiRequests: { $sum: 1 } } },
    ]),
    AuditLog.aggregate([
      { $match: { createdAt: chartRange } },
      { $group: { _id: dayKey('createdAt'), actions: { $sum: 1 }, failures: { $sum: { $cond: [{ $eq: ['$outcome', 'failure'] }, 1, 0] } } } },
    ]),
    Employee.aggregate([
      { $match: { createdAt: chartRange } },
      { $group: { _id: dayKey('createdAt'), signups: { $sum: 1 } } },
      { $project: { _id: 0, date: '$_id', signups: 1 } },
    ]),
    TokenUsageLog.aggregate([
      ...(current ? [{ $match: { createdAt: current } }] : []),
      { $group: { _id: '$feature', requests: { $sum: 1 }, tokens: { $sum: '$totalTokens' } } },
      { $sort: { requests: -1 } },
    ]),
    TokenUsageLog.aggregate([
      ...(current ? [{ $match: { createdAt: current } }] : []),
      { $group: { _id: '$organizationId', tokens: { $sum: '$totalTokens' }, requests: { $sum: 1 } } },
      { $sort: { tokens: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'organizations', localField: '_id', foreignField: '_id', as: 'org' } },
    ]),
    Organization.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).populate('organizationId', 'name').lean(),
  ]);

  const actionsMap = new Map(actionsByDay.map((row) => [row._id, row]));
  const aiMap = new Map(aiByDay.map((row) => [row._id, row.aiRequests]));
  const activityKeys = new Set([...actionsMap.keys(), ...aiMap.keys()]);
  const activityRows = [...activityKeys].map((date) => ({
    date,
    aiRequests: aiMap.get(date) ?? 0,
    actions: actionsMap.get(date)?.actions ?? 0,
    failures: actionsMap.get(date)?.failures ?? 0,
  }));

  return {
    periodDays,
    kpis: {
      organizations: { value: organizations, previous: organizationsBefore },
      activeOrganizations,
      users: { value: users, previous: usersBefore },
      newUsers: { value: newUsers, previous: newUsersPrev },
      aiTokens: { value: tokensNow.tokens, previous: tokensPrev?.tokens ?? null },
      aiRequests: { value: tokensNow.requests, previous: tokensPrev?.requests ?? null },
      actions: { value: actions, previous: actionsPrev },
      failedActions: { value: failed, previous: failedPrev },
      openTickets,
      newInquiries: { value: contacts + demos, previous: contactsPrev === null || demosPrev === null ? null : contactsPrev + demosPrev },
    },
    activityOverTime: fillDays(activityRows, chartStart, now, { aiRequests: 0, actions: 0, failures: 0 }),
    signupsOverTime: fillDays(signupsByDay, chartStart, now, { signups: 0 }),
    featureUsage: features.map((row) => ({ name: FEATURE_LABELS[row._id] ?? row._id, requests: row.requests, tokens: row.tokens })),
    topOrganizations: topOrgs.map((row) => ({ id: String(row._id), name: row.org[0]?.name ?? 'Deleted organization', tokens: row.tokens, requests: row.requests })),
    organizationStatus: orgStatus.map((row) => ({ status: row._id, count: row.count })),
    recentActivity: recent.map((entry) => ({
      id: String(entry._id),
      action: entry.action,
      actorName: entry.actorName,
      actorEmail: entry.actorEmail,
      organization: (entry.organizationId as unknown as { name?: string } | null)?.name ?? 'Platform',
      outcome: entry.outcome,
      createdAt: new Date(entry.createdAt).toISOString(),
    })),
  };
}
