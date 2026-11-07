import mongoose from 'mongoose';
import Project from '@/models/Project';
import TimeEntry from '@/models/TimeEntry';
import Timesheet from '@/models/Timesheet';
import Employee from '@/models/Employee';
import { ApiError, isPeopleTeam, requireRole, type Viewer } from '@/lib/api-route';
import { approvalForSubject, cancelApproval, startApproval } from '@/services/approvals';
import { dayKeyOf, dayKeysBetween } from '@/lib/attendance';
import { mondayOf, type ProjectView, type TimeReport, type TimesheetWeekView, type WeekEntry } from '@/lib/timesheets';

const MANAGERS = ['Admin', 'HR'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const sundayOf = (monday: string) => new Date(new Date(`${monday}T00:00:00Z`).getTime() + 6 * 86_400_000).toISOString().slice(0, 10);

const projectView = (project: any): ProjectView => ({
  id: String(project._id),
  name: project.name,
  client: project.client ?? '',
  code: project.code ?? '',
  billable: !!project.billable,
  active: !!project.active,
});

export async function listProjects(viewer: Viewer, includeArchived = false): Promise<ProjectView[]> {
  const projects = await Project.find({ organizationId: viewer.organizationId, ...(includeArchived ? {} : { active: true }) }).sort({ name: 1 }).lean();
  return projects.map(projectView);
}

/** Adds or edits a project (HR and admins). */
export async function saveProject(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, MANAGERS, 'Only HR and admins manage projects.');
  const name = String(input.name ?? '').trim().slice(0, 80);
  if (!name) throw new ApiError('Name the project.');
  const fields = { name, client: String(input.client ?? '').trim().slice(0, 80), code: String(input.code ?? '').trim().toUpperCase().slice(0, 20), billable: input.billable !== false, active: input.active !== false };
  if (typeof input.id === 'string' && mongoose.isValidObjectId(input.id)) {
    const result = await Project.updateOne({ _id: input.id, organizationId: viewer.organizationId }, { $set: fields });
    if (!result.matchedCount) throw new ApiError('Project not found.', 404);
  } else await Project.create({ organizationId: viewer.organizationId, ...fields });
  return listProjects(viewer, true);
}

/** The viewer's week: their entries, its status and approval, and the projects they can log to. */
export async function myWeek(viewer: Viewer, weekInput: unknown): Promise<TimesheetWeekView> {
  const weekStart = mondayOf(typeof weekInput === 'string' && DAY.test(weekInput) ? weekInput : dayKeyOf());
  const days = dayKeysBetween(weekStart, sundayOf(weekStart));
  const [sheet, entries, projects] = await Promise.all([
    Timesheet.findOne({ employee: viewer.id, weekStart }).lean(),
    TimeEntry.find({ employee: viewer.id, date: { $gte: days[0], $lte: days[6] } }).lean(),
    listProjects(viewer, true),
  ]);
  const status = sheet?.status ?? 'draft';
  const used = new Set(entries.map((entry) => String(entry.project)));
  return {
    id: sheet ? String(sheet._id) : null,
    weekStart,
    days,
    status,
    totalHours: entries.reduce((total, entry) => total + entry.hours, 0),
    entries: entries.map((entry) => ({ projectId: String(entry.project), date: entry.date, hours: entry.hours, note: entry.note ?? '' })),
    projects: projects.filter((project) => project.active || used.has(project.id)),
    approval: sheet ? await approvalForSubject(viewer, String(sheet._id)) : null,
    editable: status === 'draft' || status === 'rejected',
  };
}

/** Replaces the viewer's entries for a week. Only drafts and sent-back weeks can change. */
export async function saveWeek(viewer: Viewer, weekInput: unknown, entriesInput: unknown): Promise<TimesheetWeekView> {
  const week = await myWeek(viewer, weekInput);
  if (!week.editable) throw new ApiError('This week has been submitted. Withdraw it to make changes.');
  if (!Array.isArray(entriesInput)) throw new ApiError('Send the week’s entries.');
  const allowed = new Set(week.projects.map((project) => project.id));
  const clean: WeekEntry[] = [];
  const perDay = new Map<string, number>();
  for (const raw of entriesInput as Partial<WeekEntry>[]) {
    const hours = Math.round(Number(raw?.hours) * 4) / 4; // quarter-hour steps
    if (!hours) continue;
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) throw new ApiError('Hours must be between 0 and 24.');
    if (!raw?.date || !week.days.includes(raw.date)) throw new ApiError('An entry is outside this week.');
    if (!raw.projectId || !allowed.has(raw.projectId)) throw new ApiError('Choose a project for every entry.');
    perDay.set(raw.date, (perDay.get(raw.date) ?? 0) + hours);
    if (perDay.get(raw.date)! > 24) throw new ApiError(`More than 24 hours logged on ${raw.date}.`);
    clean.push({ projectId: raw.projectId, date: raw.date, hours, note: String(raw.note ?? '').trim().slice(0, 200) });
  }
  await TimeEntry.deleteMany({ employee: viewer.id, date: { $gte: week.days[0], $lte: week.days[6] } });
  if (clean.length) await TimeEntry.insertMany(clean.map((entry) => ({ organizationId: viewer.organizationId, employee: viewer.id, project: entry.projectId, date: entry.date, hours: entry.hours, note: entry.note })));
  const totalHours = clean.reduce((total, entry) => total + entry.hours, 0);
  await Timesheet.updateOne({ employee: viewer.id, weekStart: week.weekStart }, { $set: { organizationId: viewer.organizationId, totalHours }, $setOnInsert: { status: 'draft' } }, { upsert: true });
  return myWeek(viewer, week.weekStart);
}

/** Sends the week for approval. */
export async function submitWeek(viewer: Viewer, weekInput: unknown): Promise<TimesheetWeekView> {
  const week = await myWeek(viewer, weekInput);
  if (!week.editable) throw new ApiError('This week is already submitted.');
  if (week.totalHours === 0) throw new ApiError('Log some time before submitting.');
  const sheet = await Timesheet.findOneAndUpdate({ employee: viewer.id, weekStart: week.weekStart }, { $set: { status: 'submitted', submittedAt: new Date(), totalHours: week.totalHours } }, { new: true });
  await startApproval({ viewer, kind: 'timesheet', subjectId: sheet!._id as mongoose.Types.ObjectId, title: `Timesheet · week of ${week.weekStart}`, summary: `${week.totalHours} hours` });
  return myWeek(viewer, week.weekStart);
}

/** Pulls a submitted week back to draft. */
export async function withdrawWeek(viewer: Viewer, weekInput: unknown): Promise<TimesheetWeekView> {
  const week = await myWeek(viewer, weekInput);
  if (week.status !== 'submitted' || !week.id) throw new ApiError('Only a submitted week can be withdrawn.');
  await Timesheet.updateOne({ _id: week.id }, { $set: { status: 'draft' } });
  await cancelApproval(viewer, week.id);
  return myWeek(viewer, week.weekStart);
}

/** Called by the approval engine. */
export async function onTimesheetSettled(id: string, outcome: 'approved' | 'rejected' | 'cancelled') {
  const status = outcome === 'approved' ? 'approved' : outcome === 'rejected' ? 'rejected' : 'draft';
  await Timesheet.updateOne({ _id: id, status: 'submitted' }, { $set: { status } });
}

/**
 * Hours by project and by person for a date range. HR and admins see everyone; managers their reports.
 */
export async function timeReport(viewer: Viewer, fromInput: unknown, toInput: unknown): Promise<TimeReport> {
  const today = dayKeyOf();
  const from = typeof fromInput === 'string' && DAY.test(fromInput) ? fromInput : `${today.slice(0, 7)}-01`;
  const to = typeof toInput === 'string' && DAY.test(toInput) ? toInput : today;
  let people: string[] | null = null;
  if (!isPeopleTeam(viewer.role)) {
    people = (await Employee.find({ organizationId: viewer.organizationId, managerId: viewer.id }).distinct('_id')).map(String);
    if (people.length === 0) throw new ApiError('Reports are for managers, HR and admins.', 403);
  }
  const entries = await TimeEntry.find({ organizationId: viewer.organizationId, date: { $gte: from, $lte: to }, ...(people ? { employee: { $in: people } } : {}) }).lean();
  const projects = new Map((await Project.find({ organizationId: viewer.organizationId }).lean()).map((project) => [String(project._id), projectView(project)]));
  const employees = new Map((await Employee.find({ _id: { $in: entries.map((entry) => entry.employee) } }).select('name department').lean()).map((person) => [String(person._id), person]));

  const byProject = new Map<string, { hours: number; people: Set<string> }>();
  const byPerson = new Map<string, { hours: number; billableHours: number }>();
  let billableHours = 0;
  for (const entry of entries) {
    const project = String(entry.project);
    const person = String(entry.employee);
    const billable = projects.get(project)?.billable ?? false;
    const p = byProject.get(project) ?? { hours: 0, people: new Set<string>() };
    p.hours += entry.hours;
    p.people.add(person);
    byProject.set(project, p);
    const e = byPerson.get(person) ?? { hours: 0, billableHours: 0 };
    e.hours += entry.hours;
    if (billable) e.billableHours += entry.hours;
    byPerson.set(person, e);
    if (billable) billableHours += entry.hours;
  }
  return {
    from,
    to,
    totalHours: entries.reduce((total, entry) => total + entry.hours, 0),
    billableHours,
    byProject: [...byProject.entries()].filter(([id]) => projects.has(id)).map(([id, value]) => ({ project: projects.get(id)!, hours: value.hours, people: value.people.size })).sort((a, b) => b.hours - a.hours),
    byPerson: [...byPerson.entries()].map(([id, value]) => ({ employee: { id, name: employees.get(id)?.name ?? 'Former colleague', department: employees.get(id)?.department ?? '' }, ...value })).sort((a, b) => b.hours - a.hours),
  };
}
