
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { type EmployeeRole } from '@/models/Employee';
import Organization from '@/models/Organization';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/jwt';
import { sendInvite } from '@/services/auth/invite';
import { MIN_PASSWORD_LENGTH, unusablePasswordHash } from '@/services/auth/password-tokens';

type BulkEmployeeData = {
  name: string;
  email: string;
  password?: string;
  role: EmployeeRole;
  department?: string;
};

type BulkRegisterRequestBody = {
  employees: BulkEmployeeData[];
  /** Email each new employee a set-password link. Defaults to true. */
  sendInvites?: boolean;
};

type ResponseData = {
  message: string;
  createdCount: number;
  invitedCount: number;
  failedCount: number;
  errors: { email: string; reason: string }[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken || decodedToken.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Only Admins can perform this action.' });
  }

  const { organizationId: currentUserOrgId } = decodedToken;
  const { employees, sendInvites = true } = req.body as BulkRegisterRequestBody;
  if (employees?.length > 500) {
    return res.status(400).json({ error: 'Import at most 500 employees at a time.' });
  }

  if (!Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ error: 'An array of employees is required.' });
  }

  const organization = await Organization.findById(currentUserOrgId);
  if (!organization) {
    return res.status(404).json({ error: 'Admin\'s organization not found.' });
  }

  const createdEmployeesData = [];
  const registrationErrors: { email: string; reason: string }[] = [];

  // Fetch existing emails in one go for efficiency
  const incomingEmails = employees.map(e => e.email.toLowerCase());
  const existingEmployees = await Employee.find({
    email: { $in: incomingEmails },
    organizationId: currentUserOrgId
  }).select('email').lean();
  const existingEmailSet = new Set(existingEmployees.map(e => e.email));

  for (const emp of employees) {
    const { name, email, password, role, department } = emp;

    if (!name || !email || !role) {
      registrationErrors.push({ email: email || 'N/A', reason: 'Missing required fields (name, email, role).' });
      continue;
    }
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      registrationErrors.push({ email, reason: `Password must be at least ${MIN_PASSWORD_LENGTH} characters, or leave it blank to send a set-password link.` });
      continue;
    }
    
    if (typeof role !== 'string' || !['Admin', 'HR', 'Manager', 'Employee'].includes(role)) {
      registrationErrors.push({ email, reason: `Invalid role specified: ${role}.` });
      continue;
    }

    if (!email.toLowerCase().endsWith(`@${organization.emailDomain}`)) {
      registrationErrors.push({ email, reason: `Email must belong to the organization domain (@${organization.emailDomain}).` });
      continue;
    }

    if (existingEmailSet.has(email.toLowerCase())) {
        registrationErrors.push({ email, reason: 'Email already exists in this organization.' });
        continue;
    }

    try {
      const passwordHash = password ? await bcrypt.hash(password, 10) : await unusablePasswordHash();

      const newEmployee = new Employee({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role as EmployeeRole,
        organizationId: currentUserOrgId,
        department: department || undefined,
        ...(password ? { passwordSetAt: new Date() } : {}),
      });

      // Collect valid employees to insert
      createdEmployeesData.push({ employee: newEmployee });
      // Add to set to prevent duplicate entries within the same CSV
      existingEmailSet.add(email.toLowerCase());

    } catch (e: any) {
      registrationErrors.push({ email, reason: e.message || 'Failed to prepare user for creation.' });
    }
  }

  // Insert one by one so a single failure doesn't hide which rows were created.
  let createdCount = 0;
  let invitedCount = 0;
  for (const { employee } of createdEmployeesData) {
    try {
      await employee.save();
      createdCount += 1;
      if (sendInvites && (await sendInvite(req, employee, organization.name))) invitedCount += 1;
    } catch (e: any) {
      registrationErrors.push({ email: employee.email, reason: e.code === 11000 ? 'Email already exists.' : 'Failed during database insertion.' });
    }
  }

  return res.status(201).json({
    message: 'Bulk registration process completed.',
    createdCount,
    invitedCount,
    failedCount: registrationErrors.length,
    errors: registrationErrors,
  });
}
