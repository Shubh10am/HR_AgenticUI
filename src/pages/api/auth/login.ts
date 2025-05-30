
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import bcrypt from 'bcryptjs';
import { signToken, type JwtPayload } from '@/lib/jwt';

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
    organizationId: string;
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

  const { email, password } = req.body as LoginRequestBody;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const employee = await Employee.findOne({ email: email.toLowerCase() }).populate('organizationId', 'name emailDomain');
    
    if (!employee) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const tokenPayload: JwtPayload = {
      employeeId: employee._id.toString(),
      email: employee.email,
      role: employee.role,
      organizationId: employee.organizationId._id.toString(), // Assuming organizationId is populated or just an ObjectId
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
        organizationId: employee.organizationId._id.toString(),
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
