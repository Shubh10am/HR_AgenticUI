
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { type EmployeeRole, type IEmployee } from '@/models/Employee';
import Organization, { type IOrganization } from '@/models/Organization';
import bcrypt from 'bcryptjs';
import { verifyToken, type JwtPayload } from '@/lib/jwt';

// Helper to exclude passwordHash from employee object
// Ensure this utility is accurate and secure.
const sanitizeEmployee = (employee: IEmployee) => {
  const { passwordHash, ...sanitized } = employee.toObject ? employee.toObject() : employee;
  return sanitized;
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { employeeId: currentUserId, organizationId: currentUserOrgId, role: currentUserRole } = decodedToken;

  if (req.method === 'GET') {
    // Allow Admin or HR to view employees of their organization
    if (currentUserRole !== 'Admin' && currentUserRole !== 'HR') {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to view employees.' });
    }
    try {
      const employees = await Employee.find({ organizationId: currentUserOrgId }).select('-passwordHash');
      return res.status(200).json(employees.map(emp => sanitizeEmployee(emp as IEmployee)));
    } catch (error) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    // Only Admins can create new employees
    if (currentUserRole !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: Only Admins can register new employees.' });
    }

    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, role.' });
    }
    
    if (typeof role !== 'string' || !role.trim()) {
        return res.status(400).json({ error: 'Role must be a non-empty string.' });
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
      return res.status(201).json(sanitizeEmployee(newEmployee));
    } catch (error: any) {
      console.error('Error registering employee:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
