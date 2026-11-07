import mongoose from 'mongoose';
import ReviewCycle from '@/models/ReviewCycle';
import Review from '@/models/Review';
import Employee from '@/models/Employee';
import { ApiError, isPeopleTeam, requireRole, type Viewer } from '@/lib/api-route';
import { DEFAULT_REVIEW_QUESTIONS, type CycleView, type ReviewQuestion, type ReviewView } from '@/lib/performance';

const PEOPLE_TEAM = ['Admin', 'HR'];

/** Review cycles with completion counts (HR and admins). */
export async function listCycles(viewer: Viewer): Promise<CycleView[]> {
  requireRole(viewer, PEOPLE_TEAM, 'Only HR and admins manage review cycles.');
  const cycles = await ReviewCycle.find({ organizationId: viewer.organizationId }).sort({ createdAt: -1 }).lean();
  const counts = await Review.aggregate([
    { $match: { cycle: { $in: cycles.map((cycle) => cycle._id) } } },
    { $group: { _id: '$cycle', total: { $sum: 1 }, submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } } } },
  ]);
  const byCycle = new Map(counts.map((row) => [String(row._id), row]));
  return cycles.map((cycle) => ({
    id: String(cycle._id),
    name: cycle.name,
    dueAt: new Date(cycle.dueAt).toISOString(),
    status: cycle.status,
    questions: cycle.questions,
    total: byCycle.get(String(cycle._id))?.total ?? 0,
    submitted: byCycle.get(String(cycle._id))?.submitted ?? 0,
    createdAt: new Date(cycle.createdAt).toISOString(),
  }));
}

function cleanQuestions(input: unknown): ReviewQuestion[] {
  if (input === undefined) return DEFAULT_REVIEW_QUESTIONS;
  if (!Array.isArray(input) || input.length === 0 || input.length > 10) throw new ApiError('A review needs between 1 and 10 questions.');
  return input.map((raw, index) => {
    const question = raw as Partial<ReviewQuestion>;
    const text = String(question.text ?? '').trim().slice(0, 200);
    if (!text) throw new ApiError('Each question needs some text.');
    return { key: String(question.key || `q${index + 1}`).slice(0, 40), text, kind: question.kind === 'rating' ? 'rating' : 'text' };
  });
}

/** Creates a draft cycle (HR and admins). */
export async function createCycle(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, PEOPLE_TEAM, 'Only HR and admins manage review cycles.');
  const name = String(input.name ?? '').trim().slice(0, 80);
  if (!name) throw new ApiError('Name the cycle, for example "H2 2026 review".');
  const dueAt = new Date(String(input.dueAt ?? ''));
  if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() < Date.now()) throw new ApiError('Choose a due date in the future.');
  await ReviewCycle.create({ organizationId: viewer.organizationId, name, dueAt, questions: cleanQuestions(input.questions), createdBy: viewer.id });
  return listCycles(viewer);
}

/**
 * Launches a draft cycle — a self review for everyone and a manager review for everyone with a manager —
 * or closes an active one, which shares manager reviews with the people reviewed.
 */
export async function setCycleStatus(viewer: Viewer, id: unknown, status: unknown) {
  requireRole(viewer, PEOPLE_TEAM, 'Only HR and admins manage review cycles.');
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown cycle.');
  const cycle = await ReviewCycle.findOne({ _id: id, organizationId: viewer.organizationId });
  if (!cycle) throw new ApiError('Cycle not found.', 404);
  if (status === 'active') {
    if (cycle.status !== 'draft') throw new ApiError('Only a draft cycle can be launched.');
    const people = await Employee.find({ organizationId: viewer.organizationId }).select('managerId').lean();
    const reviews = people.flatMap((person) => [
      { organizationId: cycle.organizationId, cycle: cycle._id, subject: person._id, reviewer: person._id, type: 'self' },
      ...(person.managerId ? [{ organizationId: cycle.organizationId, cycle: cycle._id, subject: person._id, reviewer: person.managerId, type: 'manager' }] : []),
    ]);
    await Review.insertMany(reviews, { ordered: false }).catch(() => undefined);
  } else if (status === 'closed') {
    if (cycle.status !== 'active') throw new ApiError('Only an active cycle can be closed.');
  } else throw new ApiError('Unknown status.');
  cycle.status = status;
  await cycle.save();
  return listCycles(viewer);
}

/**
 * Whether the viewer may read a review: the reviewer always; the person reviewed sees their
 * self review, and the manager's once the cycle closes; their manager sees both; HR and admins see all.
 */
function canRead(viewer: Viewer, review: any, cycleStatus: string, subjectManager: string | null) {
  if (String(review.reviewer) === viewer.id || isPeopleTeam(viewer.role)) return true;
  if (String(review.subject) === viewer.id) return review.type === 'self' || cycleStatus === 'closed';
  return subjectManager === viewer.id && review.status === 'submitted';
}

/** The reviews the viewer writes and the ones about them (or their reports) they may read. */
export async function myReviews(viewer: Viewer): Promise<ReviewView[]> {
  const reports = await Employee.find({ organizationId: viewer.organizationId, managerId: viewer.id }).distinct('_id');
  const reviews = await Review.find({
    organizationId: viewer.organizationId,
    $or: [{ reviewer: viewer.id }, { subject: viewer.id }, { subject: { $in: reports } }],
  }).lean();
  const cycles = new Map((await ReviewCycle.find({ _id: { $in: reviews.map((review) => review.cycle) }, status: { $ne: 'draft' } }).lean()).map((cycle) => [String(cycle._id), cycle]));
  const peopleIds = reviews.flatMap((review) => [review.subject, review.reviewer]);
  const people = new Map((await Employee.find({ _id: { $in: peopleIds } }).select('name department managerId').lean()).map((person) => [String(person._id), person]));

  return reviews
    .filter((review) => {
      const cycle = cycles.get(String(review.cycle));
      const manager = people.get(String(review.subject))?.managerId;
      return cycle && canRead(viewer, review, cycle.status, manager ? String(manager) : null);
    })
    .map((review) => {
      const cycle = cycles.get(String(review.cycle))!;
      const subject = people.get(String(review.subject));
      const reviewer = people.get(String(review.reviewer));
      const mineToWrite = String(review.reviewer) === viewer.id;
      return {
        id: String(review._id),
        cycle: { id: String(cycle._id), name: cycle.name, status: cycle.status, dueAt: new Date(cycle.dueAt).toISOString() },
        subject: { id: String(review.subject), name: subject?.name ?? 'Former colleague', department: subject?.department ?? '' },
        reviewer: reviewer ? { id: String(review.reviewer), name: reviewer.name } : null,
        type: review.type,
        status: review.status,
        answers: (review.answers ?? []).map((answer) => ({ key: answer.key, rating: answer.rating ?? null, text: answer.text ?? '' })),
        questions: cycle.questions,
        submittedAt: review.submittedAt ? new Date(review.submittedAt).toISOString() : null,
        canWrite: mineToWrite && cycle.status === 'active',
      };
    })
    .sort((a, b) => Number(b.canWrite && b.status === 'pending') - Number(a.canWrite && a.status === 'pending') || b.cycle.dueAt.localeCompare(a.cycle.dueAt));
}

/** Saves a draft or submits a review the viewer writes. Submitted reviews can be edited until the cycle closes. */
export async function saveReview(viewer: Viewer, id: unknown, answers: unknown, submit: unknown) {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown review.');
  const review = await Review.findOne({ _id: id, organizationId: viewer.organizationId, reviewer: viewer.id });
  if (!review) throw new ApiError('Review not found.', 404);
  const cycle = await ReviewCycle.findById(review.cycle).lean();
  if (cycle?.status !== 'active') throw new ApiError('This review cycle is not open.');
  const given = (answers ?? {}) as Record<string, { rating?: unknown; text?: unknown }>;
  const clean = cycle.questions.map((question) => {
    const answer = given[question.key] ?? {};
    const rating = question.kind === 'rating' && answer.rating != null ? Number(answer.rating) : null;
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) throw new ApiError('Ratings go from 1 to 5.');
    return { key: question.key, rating, text: String(answer.text ?? '').trim().slice(0, 4000) };
  });
  if (submit) {
    const missing = cycle.questions.find((question, index) => (question.kind === 'rating' ? clean[index].rating === null : !clean[index].text));
    if (missing) throw new ApiError(`Answer "${missing.text}" before submitting.`);
    review.status = 'submitted';
    review.submittedAt = new Date();
  }
  review.set('answers', clean);
  await review.save();
  return (await myReviews(viewer)).find((view) => view.id === id);
}
