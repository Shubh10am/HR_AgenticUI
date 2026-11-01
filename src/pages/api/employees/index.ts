
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { type EmployeeRole, type IEmployee } from '@/models/Employee';
import Organization from '@/models/Organization';
import bcrypt from 'bcryptjs';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { sendInvite } from '@/services/auth/invite';
import { MIN_PASSWORD_LENGTH, unusablePasswordHash } from '@/services/auth/password-tokens';

const sanitizeEmployee = (employee: IEmployee) => {
  const { passwordHash, ...sanitized } = employee.toObject ? employee.toObject() : employee;
  return sanitized;
};

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { organizationId: currentUserOrgId } = req.user;

  if (req.method === 'GET') {
    try {
      const employees = await Employee.find({ organizationId: currentUserOrgId }).select('-passwordHash');
      return res.status(200).json(employees.map(emp => sanitizeEmployee(emp as IEmployee)));
    } catch (error) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } 
  
  if (req.method === 'POST') {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, role.' });
    }
    if (password && (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH)) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters, or leave it blank to email a set-password link.` });
    }
    
    if (typeof role !== 'string' || !['Admin', 'HR', 'Manager', 'Employee'].includes(role)) {
      return res.status(400).json({ error: `Invalid role specified: ${role}.` });
    }

    try {
      const organization = await Organization.findById(currentUserOrgId);
      if (!organization) {
        return res.status(404).json({ error: 'Admin\'s organization not found.' });
      }

      if (!email.toLowerCase().endsWith(`@${organization.emailDomain}`)) {
        return res.status(400).json({ error: `Employee email must belong to the organization domain (@${organization.emailDomain}).` });
      }

      const existingEmployee = await Employee.findOne({ email: email.toLowerCase(), organizationId: currentUserOrgId });
      if (existingEmployee) {
        return res.status(409).json({ error: 'An employee with this email already exists in this organization.' });
      }

      // Without a password the account can't be signed into until the invite link is used.
      const passwordHash = password ? await bcrypt.hash(password, 10) : await unusablePasswordHash();

      const newEmployee = new Employee({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role as EmployeeRole,
        organizationId: currentUserOrgId,
        department,
        ...(password ? { passwordSetAt: new Date() } : {}),
      });

      await newEmployee.save();

      // The email carries a one-time link, never the password.
      await sendInvite(req, newEmployee, organization.name);

      return res.status(201).json(sanitizeEmployee(newEmployee));
    } catch (error: any) {
      console.error('Error registering employee:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } 
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

export default withAuth(handler, 'Admin');
