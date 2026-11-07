import crypto from 'crypto';
import mongoose from 'mongoose';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Employee from '@/models/Employee';
import { ApiError, isPeopleTeam, requireRole, type Viewer } from '@/lib/api-route';
import { COURSE_CATEGORIES, type ComplianceRow, type CourseView, type EnrollmentView, type LearningOverview } from '@/lib/learning';

const PEOPLE = ['Admin', 'HR'];
const DAY = 86_400_000;

const courseView = (course: any): CourseView => ({
  id: String(course._id),
  title: course.title,
  description: course.description ?? '',
  category: course.category,
  url: course.url ?? '',
  durationMins: course.durationMins,
  mandatory: !!course.mandatory,
  dueInDays: course.dueInDays,
  active: !!course.active,
});

const iso = (date: unknown) => (date ? new Date(date as string).toISOString() : null);

async function enrollmentViews(rows: any[]): Promise<EnrollmentView[]> {
  const courses = new Map((await Course.find({ _id: { $in: rows.map((row) => row.course) } }).lean()).map((c) => [String(c._id), courseView(c)]));
  const assigners = new Map((await Employee.find({ _id: { $in: rows.map((row) => row.assignedBy).filter(Boolean) } }).select('name').lean()).map((p) => [String(p._id), p.name]));
  const now = Date.now();
  return rows
    .filter((row) => courses.has(String(row.course)))
    .map((row) => ({
      id: String(row._id),
      course: courses.get(String(row.course))!,
      status: row.status,
      dueAt: iso(row.dueAt),
      overdue: row.status !== 'completed' && !!row.dueAt && new Date(row.dueAt).getTime() < now,
      startedAt: iso(row.startedAt),
      completedAt: iso(row.completedAt),
      certificateNo: row.certificateNo ?? null,
      assignedByName: row.assignedBy ? assigners.get(String(row.assignedBy)) ?? null : null,
    }));
}

/** Gives every current colleague a mandatory course they don't have yet. */
async function enrolEveryone(organizationId: string, course: { _id: unknown; dueInDays: number }, by: string | null) {
  const people = await Employee.find({ organizationId }).distinct('_id');
  if (!people.length) return;
  await Enrollment.bulkWrite(
    people.map((employee) => ({
      updateOne: {
        filter: { course: course._id, employee },
        update: { $setOnInsert: { organizationId, course: course._id, employee, status: 'assigned', assignedBy: by, dueAt: new Date(Date.now() + course.dueInDays * DAY) } },
        upsert: true,
      },
    }))
  );
}

/** Makes sure a person has every mandatory course (new joiners pick them up on first visit). */
async function ensureMandatory(viewer: Viewer) {
  const mandatory = await Course.find({ organizationId: viewer.organizationId, mandatory: true, active: true }).select('_id dueInDays').lean();
  if (!mandatory.length) return;
  const have = new Set((await Enrollment.find({ employee: viewer.id, course: { $in: mandatory.map((c) => c._id) } }).distinct('course')).map(String));
  const missing = mandatory.filter((course) => !have.has(String(course._id)));
  if (missing.length) {
    await Enrollment.insertMany(
      missing.map((course) => ({ organizationId: viewer.organizationId, course: course._id, employee: viewer.id, status: 'assigned', dueAt: new Date(Date.now() + course.dueInDays * DAY) })),
      { ordered: false }
    ).catch(() => undefined);
  }
}

async function compliance(viewer: Viewer): Promise<ComplianceRow[]> {
  const courses = await Course.find({ organizationId: viewer.organizationId, active: true }).sort({ mandatory: -1, title: 1 }).lean();
  const now = new Date();
  const stats = await Enrollment.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(viewer.organizationId) } },
    {
      $group: {
        _id: '$course',
        assigned: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'completed'] }, { $lt: ['$dueAt', now] }, { $ne: ['$dueAt', null] }] }, 1, 0] } },
      },
    },
  ]);
  const byCourse = new Map(stats.map((row) => [String(row._id), row]));
  return courses.map((course) => {
    const row = byCourse.get(String(course._id));
    return { course: courseView(course), assigned: row?.assigned ?? 0, completed: row?.completed ?? 0, overdue: row?.overdue ?? 0 };
  });
}

/** The viewer's courses, the catalogue, and (HR and admins) completion across the organisation. */
export async function learningOverview(viewer: Viewer): Promise<LearningOverview> {
  await ensureMandatory(viewer);
  const [mine, catalogue] = await Promise.all([
    Enrollment.find({ employee: viewer.id }).sort({ status: 1, dueAt: 1 }).lean(),
    Course.find({ organizationId: viewer.organizationId, ...(isPeopleTeam(viewer.role) ? {} : { active: true }) }).sort({ mandatory: -1, title: 1 }).lean(),
  ]);
  return { mine: await enrollmentViews(mine), catalogue: catalogue.map(courseView), compliance: isPeopleTeam(viewer.role) ? await compliance(viewer) : null };
}

/** Adds or edits a course (HR and admins). Making a course mandatory assigns it to everyone. */
export async function saveCourse(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, PEOPLE, 'Only HR and admins manage courses.');
  const title = String(input.title ?? '').trim().slice(0, 120);
  if (!title) throw new ApiError('Give the course a title.');
  const category = String(input.category ?? 'Skills');
  if (!(COURSE_CATEGORIES as readonly string[]).includes(category)) throw new ApiError('Choose a category.');
  const url = String(input.url ?? '').trim().slice(0, 500);
  if (url && !/^https:\/\//i.test(url)) throw new ApiError('Course links must start with https://');
  const durationMins = Math.round(Number(input.durationMins ?? 30));
  const dueInDays = Math.round(Number(input.dueInDays ?? 30));
  if (!Number.isFinite(durationMins) || durationMins < 1 || durationMins > 6000) throw new ApiError('Set a duration in minutes.');
  if (!Number.isFinite(dueInDays) || dueInDays < 1 || dueInDays > 365) throw new ApiError('Set a due period between 1 and 365 days.');
  const fields = { title, category, url, durationMins, dueInDays, description: String(input.description ?? '').trim().slice(0, 1000), mandatory: !!input.mandatory, active: input.active !== false };
  let course;
  if (typeof input.id === 'string' && mongoose.isValidObjectId(input.id)) {
    course = await Course.findOneAndUpdate({ _id: input.id, organizationId: viewer.organizationId }, { $set: fields }, { new: true });
    if (!course) throw new ApiError('Course not found.', 404);
  } else course = await Course.create({ organizationId: viewer.organizationId, ...fields });
  if (course.mandatory && course.active) await enrolEveryone(viewer.organizationId, course, viewer.id);
  return learningOverview(viewer);
}

/**
 * Assigns a course. HR and admins can assign to anyone or to everyone; managers to their direct reports.
 */
export async function assignCourse(viewer: Viewer, input: Record<string, unknown>) {
  const courseId = String(input.courseId ?? '');
  if (!mongoose.isValidObjectId(courseId)) throw new ApiError('Choose a course.');
  const course = await Course.findOne({ _id: courseId, organizationId: viewer.organizationId, active: true }).lean();
  if (!course) throw new ApiError('Course not found.', 404);
  const ids = Array.isArray(input.employeeIds) ? input.employeeIds.map(String).filter((id) => mongoose.isValidObjectId(id)) : [];
  let allowed: string[];
  if (isPeopleTeam(viewer.role)) allowed = (await Employee.find({ organizationId: viewer.organizationId, ...(input.everyone ? {} : { _id: { $in: ids } }) }).distinct('_id')).map(String);
  else {
    const reports = new Set((await Employee.find({ organizationId: viewer.organizationId, managerId: viewer.id }).distinct('_id')).map(String));
    if (!reports.size) throw new ApiError('Only managers, HR and admins assign courses.', 403);
    allowed = (input.everyone ? [...reports] : ids).filter((id) => reports.has(id));
    if (!allowed.length) throw new ApiError('You can assign courses to your direct reports.', 403);
  }
  if (!allowed.length) throw new ApiError('Choose who to assign the course to.');
  const dueAt = input.dueAt ? new Date(String(input.dueAt)) : new Date(Date.now() + course.dueInDays * DAY);
  if (Number.isNaN(dueAt.getTime())) throw new ApiError('Choose a valid due date.');
  const result = await Enrollment.bulkWrite(
    allowed.map((employee) => ({
      updateOne: { filter: { course: course._id, employee }, update: { $setOnInsert: { organizationId: viewer.organizationId, course: course._id, employee, status: 'assigned', assignedBy: viewer.id, dueAt } }, upsert: true },
    }))
  );
  return { assigned: result.upsertedCount, alreadyHad: allowed.length - result.upsertedCount };
}

/** Joins a course from the catalogue. */
export async function enrol(viewer: Viewer, courseId: unknown) {
  if (typeof courseId !== 'string' || !mongoose.isValidObjectId(courseId)) throw new ApiError('Choose a course.');
  const course = await Course.findOne({ _id: courseId, organizationId: viewer.organizationId, active: true }).lean();
  if (!course) throw new ApiError('Course not found.', 404);
  await Enrollment.updateOne({ course: course._id, employee: viewer.id }, { $setOnInsert: { organizationId: viewer.organizationId, status: 'in-progress', startedAt: new Date() } }, { upsert: true });
  return learningOverview(viewer);
}

/** Starts or completes one of the viewer's own courses. Completing issues a certificate number. */
export async function progress(viewer: Viewer, enrollmentId: unknown, action: unknown) {
  if (typeof enrollmentId !== 'string' || !mongoose.isValidObjectId(enrollmentId)) throw new ApiError('Unknown course.');
  const row = await Enrollment.findOne({ _id: enrollmentId, employee: viewer.id });
  if (!row) throw new ApiError('Course not found.', 404);
  if (action === 'start') {
    if (row.status === 'assigned') Object.assign(row, { status: 'in-progress', startedAt: new Date() });
  } else if (action === 'complete') {
    if (row.status !== 'completed') Object.assign(row, { status: 'completed', startedAt: row.startedAt ?? new Date(), completedAt: new Date(), certificateNo: `CERT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}` });
  } else throw new ApiError('Choose start or complete.');
  await row.save();
  return learningOverview(viewer);
}
