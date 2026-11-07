import mongoose from 'mongoose';
import Letter from '@/models/Letter';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import Offboarding from '@/models/Offboarding';
import { ApiError, isPeopleTeam, requireRole, type Viewer } from '@/lib/api-route';
import { LETTER_TEMPLATES, type LetterKey, type LetterView } from '@/lib/documents';

const MANAGERS = ['Admin', 'HR'];
const day = (date: Date | null | undefined) => (date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

/** Fills a template from the person's record. Only work facts are used — no personal details. */
async function render(organizationId: string, employeeId: string, key: LetterKey, purpose: string, issuerName: string) {
  const template = LETTER_TEMPLATES.find((item) => item.key === key)!;
  const [person, org, exit] = await Promise.all([
    Employee.findById(employeeId).select('name jobTitle department joinedAt createdAt').lean(),
    Organization.findById(organizationId).select('name').lean(),
    Offboarding.findOne({ employee: employeeId, status: { $in: ['in-progress', 'completed'] } }).sort({ createdAt: -1 }).select('lastWorkingDay').lean(),
  ]);
  if (!person) throw new ApiError('That person is not in your organisation.');
  if ((key === 'experience' || key === 'relieving') && !exit) throw new ApiError('Experience and relieving letters need an exit with a last working day.');
  const values: Record<string, string> = {
    date: day(new Date()),
    name: person.name,
    jobTitle: person.jobTitle || 'a member of staff',
    department: person.department || 'company',
    joinedOn: day(person.joinedAt ?? person.createdAt),
    lastWorkingDay: day(exit?.lastWorkingDay),
    organization: (org as { name?: string } | null)?.name ?? 'the company',
    purposeClause: purpose ? ` for ${purpose}` : '',
    issuer: issuerName,
  };
  return template.body.replace(/\{\{(\w+)\}\}/g, (_, token: string) => values[token] ?? '');
}

async function toViews(viewer: Viewer, letters: any[]): Promise<LetterView[]> {
  const ids = letters.flatMap((letter) => [letter.employee, letter.issuedBy].filter(Boolean));
  const people = new Map((await Employee.find({ _id: { $in: ids } }).select('name department').lean()).map((person) => [String(person._id), person]));
  return letters.map((letter) => ({
    id: String(letter._id),
    template: letter.template,
    title: LETTER_TEMPLATES.find((item) => item.key === letter.template)?.title ?? 'Letter',
    employee: { id: String(letter.employee), name: people.get(String(letter.employee))?.name ?? 'Former colleague', department: people.get(String(letter.employee))?.department ?? '' },
    purpose: letter.purpose ?? '',
    status: letter.status,
    body: letter.status === 'issued' ? letter.body : '',
    issuedByName: letter.issuedBy ? people.get(String(letter.issuedBy))?.name ?? null : null,
    issuedAt: letter.issuedAt ? new Date(letter.issuedAt).toISOString() : null,
    createdAt: new Date(letter.createdAt).toISOString(),
    mine: String(letter.employee) === viewer.id,
  }));
}

/** The viewer's letters, or every letter (?scope=all, HR and admins). */
export async function listLetters(viewer: Viewer, scope: unknown) {
  const all = scope === 'all';
  if (all) requireRole(viewer, MANAGERS, 'Only HR and admins see every letter.');
  const letters = await Letter.find({ organizationId: viewer.organizationId, ...(all ? {} : { employee: viewer.id }) }).sort({ createdAt: -1 }).limit(300).lean();
  return toViews(viewer, letters);
}

/**
 * Requests a letter for oneself, or (HR and admins) issues one for anyone straight away.
 */
export async function requestLetter(viewer: Viewer, input: Record<string, unknown>) {
  const key = input.template as LetterKey;
  if (!LETTER_TEMPLATES.some((item) => item.key === key)) throw new ApiError('Choose a letter.');
  const purpose = String(input.purpose ?? '').trim().slice(0, 200);
  const employeeId = typeof input.employeeId === 'string' && input.employeeId ? input.employeeId : viewer.id;
  const issueNow = isPeopleTeam(viewer.role);
  if (employeeId !== viewer.id && !issueNow) throw new ApiError('You can only request letters for yourself.', 403);
  if (!mongoose.isValidObjectId(employeeId) || !(await Employee.exists({ _id: employeeId, organizationId: viewer.organizationId }))) throw new ApiError('That person is not in your organisation.');
  const body = issueNow ? await render(viewer.organizationId, employeeId, key, purpose, viewer.name) : '';
  await Letter.create({
    organizationId: viewer.organizationId,
    employee: employeeId,
    template: key,
    purpose,
    status: issueNow ? 'issued' : 'requested',
    body,
    issuedBy: issueNow ? viewer.id : null,
    issuedAt: issueNow ? new Date() : null,
  });
  return listLetters(viewer, issueNow ? 'all' : undefined);
}

/** Issues or declines a requested letter (HR and admins). */
export async function decideLetter(viewer: Viewer, id: unknown, decision: unknown) {
  requireRole(viewer, MANAGERS, 'Only HR and admins issue letters.');
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown letter.');
  const letter = await Letter.findOne({ _id: id, organizationId: viewer.organizationId, status: 'requested' });
  if (!letter) throw new ApiError('This request is not open.', 404);
  if (decision === 'issue') {
    letter.body = await render(viewer.organizationId, String(letter.employee), letter.template, letter.purpose, viewer.name);
    letter.status = 'issued';
    letter.issuedBy = new mongoose.Types.ObjectId(viewer.id);
    letter.issuedAt = new Date();
  } else if (decision === 'decline') letter.status = 'declined';
  else throw new ApiError('Choose issue or decline.');
  await letter.save();
  return listLetters(viewer, 'all');
}
