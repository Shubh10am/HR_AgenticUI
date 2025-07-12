
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { verifyToken } from '@/lib/jwt';
import crypto from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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

  if (!decodedToken || decodedToken.organizationId !== null) {
    return res.status(403).json({ error: 'Forbidden: Access restricted to platform administrators.' });
  }
  
  const { employeeId } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: 'Employee ID is required.' });
  }

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const magicToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // Token expires in 15 minutes

    employee.magicLinkToken = magicToken;
    employee.magicLinkExpires = expires;
    await employee.save();

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const appUrl = `${protocol}://${host}`;
    const magicLink = `${appUrl}/login/magic?token=${magicToken}`;

    return res.status(200).json({ magicLink });
  } catch (error) {
    console.error('Error generating magic link:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
