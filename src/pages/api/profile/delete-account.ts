
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import AttendanceRecord from '@/models/AttendanceRecord';
import LeaveRequest from '@/models/LeaveRequest';
import TokenUsageLog from '@/models/TokenUsageLog';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import bcrypt from 'bcryptjs';

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { id: employeeId, organizationId, role } = req.user;
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

      await TokenUsageLog.deleteMany({ organizationId });
      await LeaveRequest.deleteMany({ organizationId });
      await AttendanceRecord.deleteMany({ organizationId });
      await Employee.deleteMany({ organizationId });
      await Organization.findByIdAndDelete(organizationId);
      
      return res.status(200).json({ message: 'Organization and all associated data have been deleted.' });

    } else {
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

export default withAuth(handler);
