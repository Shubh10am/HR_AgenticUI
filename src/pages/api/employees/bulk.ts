
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { type EmployeeRole } from '@/models/Employee';
import Organization from '@/models/Organization';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/jwt';
import { sendNewEmployeeWelcomeEmail } from '@/services/mailerService';

type BulkEmployeeData = {
  name: string;
  email: string;
  password?: string;
  role: EmployeeRole;
  department?: string;
};

type BulkRegisterRequestBody = {
  employees: BulkEmployeeData[];
};

type ResponseData = {
  message: string;
  createdCount: number;
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
  const { employees } = req.body as BulkRegisterRequestBody;

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

    if (!name || !email || !password || !role) {
      registrationErrors.push({ email: email || 'N/A', reason: 'Missing required fields (name, email, password, role).' });
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
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newEmployee = new Employee({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role as EmployeeRole,
        organizationId: currentUserOrgId,
        department: department || undefined,
      });

      // Collect valid employees to insert
      createdEmployeesData.push({ employee: newEmployee, plainPassword: password });
      // Add to set to prevent duplicate entries within the same CSV
      existingEmailSet.add(email.toLowerCase());

    } catch (e: any) {
      registrationErrors.push({ email, reason: e.message || 'Failed to prepare user for creation.' });
    }
  }

  // Bulk insert valid employees
  if (createdEmployeesData.length > 0) {
    const employeesToInsert = createdEmployeesData.map(data => data.employee);
    try {
      const insertedDocs = await Employee.insertMany(employeesToInsert, { ordered: false });
      
      // Fire-and-forget welcome emails for successfully inserted employees
      insertedDocs.forEach(doc => {
          const originalData = createdEmployeesData.find(d => d.employee.email === doc.email);
          if (originalData) {
              sendNewEmployeeWelcomeEmail({ name: doc.name, email: doc.email }, organization.name, originalData.plainPassword);
          }
      });

    } catch (e: any) {
        // Handle potential errors during the bulk insert itself
        const insertedIds = new Set(e.result?.insertedIds?.map((i: any) => i._id.toString()) || []);
        const failedInserts = employeesToInsert.filter(emp => !insertedIds.has(emp._id.toString()));

        failedInserts.forEach(emp => {
            registrationErrors.push({ email: emp.email, reason: 'Failed during database insertion.' });
        });
        
        // Also send emails for those that *did* succeed even if others failed
        const successfulInserts = employeesToInsert.filter(emp => insertedIds.has(emp._id.toString()));
        successfulInserts.forEach(doc => {
           const originalData = createdEmployeesData.find(d => d.employee.email === doc.email);
           if (originalData) {
              sendNewEmployeeWelcomeEmail({ name: doc.name, email: doc.email }, organization.name, originalData.plainPassword);
           }
        });
    }
  }

  return res.status(201).json({
    message: 'Bulk registration process completed.',
    createdCount: createdEmployeesData.length - registrationErrors.length,
    failedCount: registrationErrors.length,
    errors: registrationErrors,
  });
}
