import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import AttendanceRecord from '@/models/AttendanceRecord';
import LeaveRequest from '@/models/LeaveRequest';
import TokenUsageLog from '@/models/TokenUsageLog';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
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

  const { employeeId, organizationId, role } = decodedToken;
  const { password, organizationName } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password confirmation is required.' });
  }

  try {
    const user = await Employee.findById(employeeId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    if (role === 'Admin') {
      const org = await Organization.findById(organizationId);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found.' });
      }
      if (org.name !== organizationName) {
        return res.status(400).json({ error: 'Organization name does not match.' });
      }

      // Cascading delete for the entire organization
      await TokenUsageLog.deleteMany({ organizationId });
      await LeaveRequest.deleteMany({ organizationId });
      await AttendanceRecord.deleteMany({ organizationId });
      await Employee.deleteMany({ organizationId });
      await Organization.findByIdAndDelete(organizationId);
      
      return res.status(200).json({ message: 'Organization and all associated data have been deleted.' });

    } else {
      // Delete a single non-admin user and their associated data
      await TokenUsageLog.deleteMany({ employeeId });
      await LeaveRequest.deleteMany({ employeeId });
      await AttendanceRecord.deleteMany({ employeeId });
      await Employee.findByIdAndDelete(employeeId);
      
      return res.status(200).json({ message: 'Account and all associated data have been deleted.' });
    }

  } catch (error: any) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
