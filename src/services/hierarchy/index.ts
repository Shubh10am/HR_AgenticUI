import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import type { OrgPerson } from '@/lib/hierarchy';

/** Everyone in the organization with their reporting line, ready for the org chart. */
export async function listOrgPeople(organizationId: string): Promise<OrgPerson[]> {
  await dbConnect();
  const rows = await Employee.find({ organizationId }).select('name email role department jobTitle managerId').sort({ name: 1 }).lean();
  return rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department ?? '',
    jobTitle: row.jobTitle ?? '',
    managerId: row.managerId ? String(row.managerId) : null,
  }));
}

/**
 * Changes who a person reports to and/or their job title.
 *
 * @returns An error message, or null when saved.
 */
export async function updateReportingLine(
  organizationId: string,
  employeeId: string,
  input: { managerId?: unknown; jobTitle?: unknown }
): Promise<string | null> {
  if (!mongoose.isValidObjectId(employeeId)) return 'Unknown person.';
  const people = await listOrgPeople(organizationId);
  const byId = new Map(people.map((person) => [person.id, person]));
  if (!byId.has(employeeId)) return 'That person is not in your organization.';

  const update: Record<string, unknown> = {};
  if (input.managerId !== undefined) {
    const managerId = input.managerId === null || input.managerId === '' ? null : String(input.managerId);
    if (managerId) {
      if (!byId.has(managerId)) return 'The chosen manager is not in your organization.';
      if (managerId === employeeId) return 'A person cannot report to themselves.';
      // Walk up from the new manager; reaching this person would make a loop.
      for (let cursor: string | null = managerId, hops = 0; cursor && hops <= people.length; hops++) {
        if (cursor === employeeId) return 'That would create a loop: the chosen manager already reports to this person.';
        cursor = byId.get(cursor)?.managerId ?? null;
      }
    }
    update.managerId = managerId;
  }
  if (input.jobTitle !== undefined) {
    const jobTitle = typeof input.jobTitle === 'string' ? input.jobTitle.trim() : '';
    if (jobTitle.length > 80) return 'Job title must be 80 characters or fewer.';
    update.jobTitle = jobTitle;
  }
  if (Object.keys(update).length === 0) return 'Nothing to change.';

  await Employee.updateOne({ _id: employeeId, organizationId }, { $set: update });
  return null;
}
