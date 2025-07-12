
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import { signToken, type JwtPayload } from '@/lib/jwt';
import type { OrganizationStatus } from '@/models/Organization';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  const { token: magicToken } = req.body;

  if (!magicToken) {
    return res.status(400).json({ error: 'Magic token is required.' });
  }

  try {
    const employee = await Employee.findOne({
      magicLinkToken: magicToken,
      magicLinkExpires: { $gt: new Date() },
    }).populate('organizationId', 'status');

    if (!employee) {
      return res.status(401).json({ error: 'Invalid or expired magic link.' });
    }

    // Invalidate the magic link immediately after use
    employee.magicLinkToken = undefined;
    employee.magicLinkExpires = undefined;
    await employee.save();

    const organization = employee.organizationId as any;

    const tokenPayload: JwtPayload = {
      employeeId: employee._id.toString(),
      email: employee.email,
      role: employee.role,
      organizationId: organization._id.toString(),
      name: employee.name,
    };

    const sessionToken = signToken(tokenPayload);

    return res.status(200).json({
      message: 'Magic login successful.',
      token: sessionToken,
      user: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        role: employee.role,
        organizationId: organization._id.toString(),
        organizationStatus: organization.status as OrganizationStatus,
      },
    });

  } catch (error) {
    console.error('Magic login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
