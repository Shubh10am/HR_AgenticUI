import mongoose from 'mongoose';
import Survey from '@/models/Survey';
import SurveyResponse from '@/models/SurveyResponse';
import SurveyParticipation from '@/models/SurveyParticipation';
import Employee from '@/models/Employee';
import { ApiError, requireRole, type Viewer } from '@/lib/api-route';
import { MIN_RESPONSES, type QuestionResult, type SurveyQuestion, type SurveyResults, type SurveyView } from '@/lib/surveys';

const PEOPLE_TEAM = ['Admin', 'HR'];
const KINDS = ['enps', 'scale', 'choice', 'text'];

const isClosed = (survey: { status: string; closesAt?: Date | null }) =>
  survey.status === 'closed' || (survey.status === 'open' && !!survey.closesAt && survey.closesAt.getTime() < Date.now());

async function toViews(viewer: Viewer, surveys: any[]): Promise<SurveyView[]> {
  const ids = surveys.map((survey) => survey._id);
  const [responses, answered, invited] = await Promise.all([
    SurveyResponse.aggregate([{ $match: { survey: { $in: ids } } }, { $group: { _id: '$survey', count: { $sum: 1 } } }]),
    SurveyParticipation.find({ survey: { $in: ids }, employee: viewer.id }).distinct('survey'),
    Employee.countDocuments({ organizationId: viewer.organizationId }),
  ]);
  const counts = new Map(responses.map((row) => [String(row._id), row.count as number]));
  const done = new Set(answered.map(String));
  return surveys.map((survey) => ({
    id: String(survey._id),
    title: survey.title,
    description: survey.description ?? '',
    status: isClosed(survey) ? 'closed' : survey.status,
    closesAt: survey.closesAt ? new Date(survey.closesAt).toISOString() : null,
    questions: survey.questions,
    responses: counts.get(String(survey._id)) ?? 0,
    invited,
    answered: done.has(String(survey._id)),
    createdAt: new Date(survey.createdAt).toISOString(),
  }));
}

/** Open and closed surveys for everyone; drafts too for HR and admins. */
export async function listSurveys(viewer: Viewer): Promise<SurveyView[]> {
  const staff = PEOPLE_TEAM.includes(viewer.role) || viewer.role === 'SuperAdmin';
  const surveys = await Survey.find({ organizationId: viewer.organizationId, ...(staff ? {} : { status: { $ne: 'draft' } }) }).sort({ createdAt: -1 }).lean();
  return toViews(viewer, surveys);
}

function cleanQuestions(input: unknown): SurveyQuestion[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 12) throw new ApiError('A survey needs between 1 and 12 questions.');
  return input.map((raw, index) => {
    const question = raw as Partial<SurveyQuestion>;
    const text = String(question.text ?? '').trim().slice(0, 200);
    if (!text) throw new ApiError('Each question needs some text.');
    if (!KINDS.includes(question.kind as string)) throw new ApiError('Unknown question type.');
    const options = question.kind === 'choice' ? (question.options ?? []).map((option) => String(option).trim().slice(0, 60)).filter(Boolean) : undefined;
    if (options && (options.length < 2 || options.length > 8)) throw new ApiError('Choice questions need between 2 and 8 options.');
    return { key: String(question.key || `q${index + 1}`).slice(0, 40), kind: question.kind!, text, options };
  });
}

/** Creates a survey, opening it straight away unless saved as a draft (HR and admins). */
export async function createSurvey(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, PEOPLE_TEAM, 'Only HR and admins create surveys.');
  const title = String(input.title ?? '').trim().slice(0, 120);
  if (!title) throw new ApiError('Give the survey a title.');
  const days = Number(input.closesInDays);
  await Survey.create({
    organizationId: viewer.organizationId,
    title,
    description: String(input.description ?? '').trim().slice(0, 500),
    questions: cleanQuestions(input.questions),
    status: input.draft ? 'draft' : 'open',
    closesAt: Number.isFinite(days) && days > 0 ? new Date(Date.now() + Math.min(days, 60) * 86_400_000) : null,
    createdBy: viewer.id,
  });
  return listSurveys(viewer);
}

async function surveyOf(viewer: Viewer, id: unknown) {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown survey.');
  const survey = await Survey.findOne({ _id: id, organizationId: viewer.organizationId });
  if (!survey) throw new ApiError('Survey not found.', 404);
  return survey;
}

/** Opens a draft or closes an open survey (HR and admins). */
export async function setSurveyStatus(viewer: Viewer, id: unknown, status: unknown) {
  requireRole(viewer, PEOPLE_TEAM, 'Only HR and admins manage surveys.');
  const survey = await surveyOf(viewer, id);
  if (status !== 'open' && status !== 'closed') throw new ApiError('Unknown status.');
  survey.status = status;
  if (status === 'closed') survey.closesAt = new Date();
  await survey.save();
  return listSurveys(viewer);
}

/**
 * Records answers anonymously. The participation record (who answered) and the answers are stored
 * separately with random ids and no timestamps, so answers cannot be traced back.
 */
export async function respond(viewer: Viewer, id: unknown, answers: unknown) {
  const survey = await surveyOf(viewer, id);
  if (survey.status !== 'open' || isClosed(survey)) throw new ApiError('This survey is closed.');
  const given = (answers ?? {}) as Record<string, unknown>;
  const clean = survey.questions.flatMap((question): { key: string; value: number | string }[] => {
    const raw = given[question.key];
    if (raw === undefined || raw === null || raw === '') return [];
    if (question.kind === 'enps' || question.kind === 'scale') {
      const value = Number(raw);
      const [min, max] = question.kind === 'enps' ? [0, 10] : [1, 5];
      if (!Number.isInteger(value) || value < min || value > max) throw new ApiError(`Answer "${question.text}" with a value from ${min} to ${max}.`);
      return [{ key: question.key, value }];
    }
    if (question.kind === 'choice') {
      if (!question.options?.includes(String(raw))) throw new ApiError(`Choose one of the options for "${question.text}".`);
      return [{ key: question.key, value: String(raw) }];
    }
    return [{ key: question.key, value: String(raw).trim().slice(0, 2000) }];
  });
  if (clean.length === 0) throw new ApiError('Answer at least one question.');
  try {
    await SurveyParticipation.create({ survey: survey._id, employee: viewer.id });
  } catch {
    throw new ApiError('You have already answered this survey.');
  }
  const person = await Employee.findById(viewer.id).select('department').lean();
  await SurveyResponse.create({ survey: survey._id, department: person?.department ?? '', answers: clean });
  return { ok: true };
}

const enpsOf = (scores: number[]) =>
  scores.length ? Math.round(((scores.filter((score) => score >= 9).length - scores.filter((score) => score <= 6).length) / scores.length) * 100) : null;

/** Aggregated results (HR and admins). Hidden below the minimum, and departments are only shown with enough answers. */
export async function surveyResults(viewer: Viewer, id: unknown): Promise<SurveyResults> {
  requireRole(viewer, PEOPLE_TEAM, 'Only HR and admins can see results.');
  const survey = await surveyOf(viewer, id);
  const [view] = await toViews(viewer, [survey.toObject()]);
  const responses = await SurveyResponse.find({ survey: survey._id }).lean();
  if (responses.length < MIN_RESPONSES) return { survey: view, visible: false, questions: [], byDepartment: [] };

  const valuesOf = (key: string, rows = responses) => rows.flatMap((row) => row.answers.filter((answer) => answer.key === key).map((answer) => answer.value));
  const questions: QuestionResult[] = survey.questions.map((question) => {
    const values = valuesOf(question.key);
    if (question.kind === 'enps') {
      const scores = values.map(Number);
      return {
        key: question.key,
        kind: 'enps',
        text: question.text,
        score: enpsOf(scores) ?? 0,
        promoters: scores.filter((score) => score >= 9).length,
        passives: scores.filter((score) => score === 7 || score === 8).length,
        detractors: scores.filter((score) => score <= 6).length,
        distribution: Array.from({ length: 11 }, (_, score) => scores.filter((value) => value === score).length),
      };
    }
    if (question.kind === 'scale') {
      const scores = values.map(Number);
      return {
        key: question.key,
        kind: 'scale',
        text: question.text,
        average: scores.length ? Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10) / 10 : 0,
        distribution: [1, 2, 3, 4, 5].map((score) => scores.filter((value) => value === score).length),
      };
    }
    if (question.kind === 'choice') {
      return { key: question.key, kind: 'choice', text: question.text, counts: (question.options ?? []).map((option) => ({ option, count: values.filter((value) => value === option).length })) };
    }
    // Shuffle free text so the order says nothing about who wrote what.
    const answers = values.map(String).filter(Boolean).sort(() => Math.random() - 0.5);
    return { key: question.key, kind: 'text', text: question.text, answers };
  });

  const groups = new Map<string, typeof responses>();
  for (const row of responses) groups.set(row.department || 'Unassigned', [...(groups.get(row.department || 'Unassigned') ?? []), row]);
  const enpsKey = survey.questions.find((question) => question.kind === 'enps')?.key;
  const scaleKeys = survey.questions.filter((question) => question.kind === 'scale').map((question) => question.key);
  const byDepartment = [...groups.entries()]
    .filter(([, rows]) => rows.length >= MIN_RESPONSES)
    .map(([department, rows]) => {
      const scale = scaleKeys.flatMap((key) => valuesOf(key, rows)).map(Number);
      return {
        department,
        responses: rows.length,
        enps: enpsKey ? enpsOf(valuesOf(enpsKey, rows).map(Number)) : null,
        scaleAverage: scale.length ? Math.round((scale.reduce((total, score) => total + score, 0) / scale.length) * 10) / 10 : null,
      };
    })
    .sort((a, b) => b.responses - a.responses);

  return { survey: view, visible: true, questions, byDepartment };
}
