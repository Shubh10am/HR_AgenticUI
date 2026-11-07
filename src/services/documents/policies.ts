import mongoose from 'mongoose';
import PolicyDocument from '@/models/PolicyDocument';
import PolicyAcknowledgement from '@/models/PolicyAcknowledgement';
import Employee from '@/models/Employee';
import { ApiError, isPeopleTeam, requireRole, type Viewer } from '@/lib/api-route';
import type { AckStatusView, PolicyDocView } from '@/lib/documents';

const MANAGERS = ['Admin', 'HR'];

/** Published policies, with the viewer's signature status and (HR/admins) completion counts. */
export async function listPolicies(viewer: Viewer): Promise<PolicyDocView[]> {
  const docs = await PolicyDocument.find({ organizationId: viewer.organizationId, archived: false }).sort({ updatedAt: -1 }).lean();
  const mine = await PolicyAcknowledgement.find({ employee: viewer.id, document: { $in: docs.map((doc) => doc._id) } }).lean();
  const staff = isPeopleTeam(viewer.role);
  const headcount = staff ? await Employee.countDocuments({ organizationId: viewer.organizationId }) : null;
  const counts = staff
    ? new Map(
        (await PolicyAcknowledgement.aggregate([{ $match: { document: { $in: docs.map((doc) => doc._id) } } }, { $group: { _id: { d: '$document', v: '$version' }, n: { $sum: 1 } } }])).map((row) => [`${row._id.d}:${row._id.v}`, row.n as number])
      )
    : null;
  return docs.map((doc) => {
    const ack = mine.find((row) => String(row.document) === String(doc._id) && row.version === doc.version);
    return {
      id: String(doc._id),
      title: doc.title,
      body: doc.body,
      version: doc.version,
      requiresAck: doc.requiresAck,
      updatedAt: new Date(doc.updatedAt).toISOString(),
      myAck: ack ? { signedName: ack.signedName, at: new Date(ack.createdAt).toISOString() } : null,
      ackCount: counts ? counts.get(`${doc._id}:${doc.version}`) ?? 0 : null,
      headcount,
    };
  });
}

function clean(input: Record<string, unknown>) {
  const title = String(input.title ?? '').trim().slice(0, 120);
  const body = String(input.body ?? '').trim().slice(0, 20000);
  if (!title || !body) throw new ApiError('Add a title and the policy text.');
  return { title, body, requiresAck: input.requiresAck !== false };
}

/** Publishes a new policy (HR and admins). */
export async function createPolicy(viewer: Viewer, input: Record<string, unknown>) {
  requireRole(viewer, MANAGERS, 'Only HR and admins publish policies.');
  await PolicyDocument.create({ organizationId: viewer.organizationId, ...clean(input), updatedBy: viewer.id });
  return listPolicies(viewer);
}

async function load(viewer: Viewer, id: unknown) {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new ApiError('Unknown policy.');
  const doc = await PolicyDocument.findOne({ _id: id, organizationId: viewer.organizationId, archived: false });
  if (!doc) throw new ApiError('Policy not found.', 404);
  return doc;
}

/** Edits a policy. Changing the text starts a new version that everyone signs again. */
export async function updatePolicy(viewer: Viewer, id: unknown, input: Record<string, unknown>) {
  requireRole(viewer, MANAGERS, 'Only HR and admins edit policies.');
  const doc = await load(viewer, id);
  if (input.archived === true) {
    doc.archived = true;
  } else {
    const next = clean(input);
    if (next.body !== doc.body) doc.version += 1;
    Object.assign(doc, next, { updatedBy: viewer.id });
  }
  await doc.save();
  return listPolicies(viewer);
}

/** Signs the current version by typing one's full name. */
export async function acknowledgePolicy(viewer: Viewer, id: unknown, signedName: unknown) {
  const doc = await load(viewer, id);
  const name = typeof signedName === 'string' ? signedName.trim().replace(/\s+/g, ' ') : '';
  const person = await Employee.findById(viewer.id).select('name').lean();
  if (!person || name.toLowerCase() !== person.name.trim().replace(/\s+/g, ' ').toLowerCase()) throw new ApiError(`Type your full name exactly as "${person?.name}" to sign.`);
  await PolicyAcknowledgement.updateOne(
    { document: doc._id, version: doc.version, employee: viewer.id },
    { $setOnInsert: { organizationId: viewer.organizationId, signedName: name } },
    { upsert: true }
  );
  return listPolicies(viewer);
}

/** Who has and hasn't signed the current version (HR and admins). */
export async function ackStatus(viewer: Viewer, id: unknown): Promise<AckStatusView> {
  requireRole(viewer, MANAGERS, 'Only HR and admins can see who has signed.');
  const doc = await load(viewer, id);
  const [people, acks] = await Promise.all([
    Employee.find({ organizationId: viewer.organizationId }).select('name department').sort({ name: 1 }).lean(),
    PolicyAcknowledgement.find({ document: doc._id, version: doc.version }).lean(),
  ]);
  const byPerson = new Map(acks.map((ack) => [String(ack.employee), ack]));
  const signed: AckStatusView['signed'] = [];
  const pending: AckStatusView['pending'] = [];
  for (const person of people) {
    const ack = byPerson.get(String(person._id));
    const base = { id: String(person._id), name: person.name, department: person.department ?? '' };
    if (ack) signed.push({ ...base, signedName: ack.signedName, at: new Date(ack.createdAt).toISOString() });
    else pending.push(base);
  }
  return { signed, pending };
}
