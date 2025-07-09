
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

  const { employeeId } = decodedToken;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, employee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }
    
    const isSamePassword = await bcrypt.compare(newPassword, employee.passwordHash);
    if (isSamePassword) {
        return res.status(400).json({ error: 'New password cannot be the same as the current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    employee.passwordHash = await bcrypt.hash(newPassword, salt);
    await employee.save();

    return res.status(200).json({ message: 'Password updated successfully.' });

  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
