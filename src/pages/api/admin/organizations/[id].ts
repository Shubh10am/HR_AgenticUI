
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Organization from '@/models/Organization';
import Employee from '@/models/Employee';
import AttendanceRecord from '@/models/AttendanceRecord';
import LeaveRequest from '@/models/LeaveRequest';
import TokenUsageLog from '@/models/TokenUsageLog';
import CompanyPolicy from '@/models/CompanyPolicy';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  const { id } = req.query;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid organization ID format.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken || decodedToken.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to platform administrators.' });
  }

  const orgId = new mongoose.Types.ObjectId(id);

  if (req.method === 'PUT') {
    const { name, emailDomain } = req.body;
    if (!name && !emailDomain) {
      return res.status(400).json({ error: 'At least one field (name, emailDomain) is required for update.' });
    }

    try {
      const organization = await Organization.findById(orgId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found.' });
      }

      if (name) organization.name = name;
      if (emailDomain) organization.emailDomain = emailDomain;

      await organization.save();
      return res.status(200).json({ message: 'Organization updated successfully.', organization });
    } catch (error: any) {
      console.error('Error updating organization:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'DELETE') {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const organization = await Organization.findById(orgId).session(session);
      if (!organization) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Organization not found.' });
      }

      // Perform a cascading delete within a transaction
      await TokenUsageLog.deleteMany({ organizationId: orgId }, { session });
      await LeaveRequest.deleteMany({ organizationId: orgId }, { session });
      await AttendanceRecord.deleteMany({ organizationId: orgId }, { session });
      await CompanyPolicy.deleteMany({ organizationId: orgId }, { session });
      await Employee.deleteMany({ organizationId: orgId }, { session });
      await Organization.findByIdAndDelete(orgId, { session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ message: `Organization "${organization.name}" and all its data have been deleted.` });
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error deleting organization:', error);
      return res.status(500).json({ error: 'Internal Server Error during deletion.' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
