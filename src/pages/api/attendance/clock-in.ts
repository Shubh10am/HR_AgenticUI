
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import AttendanceRecord from '@/models/AttendanceRecord';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import { startOfDay, endOfDay } from 'date-fns';

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

  if (!decodedToken) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { employeeId, organizationId } = decodedToken;
  const now = new Date();
  const todayDate = startOfDay(now); // Normalize to the beginning of the day for consistent querying

  try {
    // Check if already clocked in today
    const existingRecord = await AttendanceRecord.findOne({
      employeeId,
      date: todayDate,
    });

    if (existingRecord) {
      // If there's a record but no clockOutTime, it means already clocked in.
      if (!existingRecord.clockOutTime) {
        return res.status(409).json({ error: 'Already clocked in for today.' });
      }
      // If there is a clockOutTime, it means they clocked out and are trying to clock in again.
      // Depending on policy, you might allow multiple clock-ins or prevent it.
      // For simplicity, let's prevent multiple full clock-in/out cycles on the same day via this endpoint.
      // A more advanced system might handle breaks differently.
      return res.status(409).json({ error: 'You have already completed a work session for today. Contact HR for adjustments.' });
    }

    // Create new clock-in record
    const newRecord = new AttendanceRecord({
      employeeId,
      organizationId,
      date: todayDate,
      clockInTime: now,
      // Status can be set here based on expected start time if available
      // e.g., status: now.getHours() > 9 ? 'Late' : 'Present',
    });

    await newRecord.save();

    return res.status(201).json({
      message: 'Clocked in successfully.',
      record: {
        id: newRecord._id,
        clockInTime: newRecord.clockInTime,
        date: newRecord.date,
      },
    });
  } catch (error: any) {
    console.error('Clock-in error:', error);
    if (error.code === 11000) { // MongoDB duplicate key error
        return res.status(409).json({ error: 'An attendance record for today might already exist or there was a conflict.' });
    }
    return res.status(500).json({ error: 'Internal Server Error during clock-in.' });
  }
}
