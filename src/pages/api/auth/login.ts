
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

const SUPER_ADMIN_EMAIL = 'shubham12342019@gmail.com';
const SUPER_ADMIN_PASSWORD = '$Shubh@912513';

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
    // --- SuperAdmin Check ---
    if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
      let superAdmin = await Admin.findOne({ email });

      // If SuperAdmin doesn't exist, create it (first-time seed)
      if (!superAdmin) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, salt);
        superAdmin = new Admin({
          email: SUPER_ADMIN_EMAIL.toLowerCase(),
          passwordHash,
          role: 'SuperAdmin',
        });
        await superAdmin.save();
      }

      const isMatch = await bcrypt.compare(password, superAdmin.passwordHash);
      if (isMatch) {
        const tokenPayload: JwtPayload = {
          employeeId: superAdmin._id.toString(),
          email: superAdmin.email,
          role: superAdmin.role,
          organizationId: null, // SuperAdmin is not tied to an organization
          name: 'Shubham (SuperAdmin)',
        };
        const token = signToken(tokenPayload);
        return res.status(200).json({
          message: 'SuperAdmin login successful.',
          token,
          user: {
            id: superAdmin._id.toString(),
            name: tokenPayload.name,
            email: superAdmin.email,
            role: superAdmin.role,
            organizationId: null,
          },
        });
      }
      // If password doesn't match, fall through to prevent confirming the account exists
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
