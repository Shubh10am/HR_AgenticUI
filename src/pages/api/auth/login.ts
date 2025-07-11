
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Admin, { type IAdmin } from '@/models/Admin';
import Organization from '@/models/Organization';
import bcrypt from 'bcryptjs';
import { signToken, type JwtPayload } from '@/lib/jwt';
import type { EmployeeRole } from '@/models/Employee';

type LoginRequestBody = {
  email: string;
  password: string;
};

type ResponseData = {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: JwtPayload['role'];
    organizationId: string | null; // SuperAdmin won't have an org
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  let { email, password } = req.body as LoginRequestBody;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  email = email.toLowerCase();

  try {
    // --- SuperAdmin/Admin Check ---
    const adminUser = await Admin.findOne({ email });
    if (adminUser) {
      const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
      if (isMatch) {
        const tokenPayload: JwtPayload = {
          employeeId: adminUser._id.toString(),
          email: adminUser.email,
          role: adminUser.role,
          organizationId: null, // Admins are not tied to an organization
          name: adminUser.role === 'SuperAdmin' ? 'Shubham' : 'Admin', // Example name
        };
        const token = signToken(tokenPayload);
        return res.status(200).json({
          message: `${adminUser.role} login successful.`,
          token,
          user: {
            id: adminUser._id.toString(),
            name: tokenPayload.name,
            email: adminUser.email,
            role: adminUser.role,
            organizationId: null,
          },
        });
      }
      // If password doesn't match, fall through to check employee collection.
      // Or, we could fail here to prevent account enumeration. For simplicity, we fall through,
      // but in a high-security scenario, we'd return an error immediately.
    }


    // --- Regular Employee Check ---
    let employee = await Employee.findOne({ email }).populate('organizationId', 'name emailDomain');
    
    if (!employee) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!employee.organizationId || typeof employee.organizationId !== 'object' || !('_id' in employee.organizationId)) {
        console.error('Organization ID missing or not populated for employee:', employee._id);
        return res.status(500).json({ error: 'Internal server error: Organization details missing.' });
    }

    const tokenPayload: JwtPayload = {
      employeeId: employee._id.toString(),
      email: employee.email,
      role: employee.role,
      organizationId: (employee.organizationId as any)._id.toString(),
      name: employee.name,
    };

    const token = signToken(tokenPayload);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        role: employee.role,
        organizationId: (employee.organizationId as any)._id.toString(),
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
