
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { type EmployeeRole, type IEmployee } from '@/models/Employee';
import Organization from '@/models/Organization';
import bcrypt from 'bcryptjs';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { sendNewEmployeeWelcomeEmail } from '@/services/mailerService';

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

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, role.' });
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

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newEmployee = new Employee({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role as EmployeeRole,
        organizationId: currentUserOrgId,
        department,
      });

      await newEmployee.save();

      // Send welcome email
      sendNewEmployeeWelcomeEmail({ name, email }, organization.name, password);

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
