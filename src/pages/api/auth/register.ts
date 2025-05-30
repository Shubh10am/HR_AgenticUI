
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Organization from '@/models/Organization';
import Employee, { type EmployeeRole } from '@/models/Employee';
import bcrypt from 'bcryptjs';

type RegisterRequestBody = {
  orgName: string;
  orgDomain: string;
  adminName: string;
  adminEmail: string;
  password: string;
};

type ResponseData = {
  message: string;
  organizationId?: string;
  employeeId?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  const { orgName, orgDomain, adminName, adminEmail, password } = req.body as RegisterRequestBody;

  if (!orgName || !orgDomain || !adminName || !adminEmail || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Validate email domain format (simple check)
  if (!orgDomain.includes('.')) {
    return res.status(400).json({ error: 'Invalid organization domain format.' });
  }
  if (!adminEmail.endsWith(`@${orgDomain}`)) {
    return res.status(400).json({ error: `Admin email must belong to the organization domain (@${orgDomain}).` });
  }


  try {
    // Check if organization domain already exists (optional, but good practice)
    const existingOrg = await Organization.findOne({ emailDomain: orgDomain.toLowerCase() });
    if (existingOrg) {
      return res.status(409).json({ error: 'Organization with this email domain already exists.' });
    }
    
    // Check if admin email already exists
    const existingEmployee = await Employee.findOne({ email: adminEmail.toLowerCase() });
    if (existingEmployee) {
      return res.status(409).json({ error: 'An employee with this email already exists.' });
    }

    // Create new organization
    const newOrganization = new Organization({
      name: orgName,
      emailDomain: orgDomain.toLowerCase(),
    });
    await newOrganization.save();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create admin employee
    const adminEmployee = new Employee({
      name: adminName,
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: 'Admin' as EmployeeRole,
      organizationId: newOrganization._id,
    });
    await adminEmployee.save();

    return res.status(201).json({
      message: 'Organization and admin user registered successfully.',
      organizationId: newOrganization._id.toString(),
      employeeId: adminEmployee._id.toString(),
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    // Handle Mongoose validation errors or other specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
