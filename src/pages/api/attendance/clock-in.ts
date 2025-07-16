
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import AttendanceRecord from '@/models/AttendanceRecord';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { startOfDay } from 'date-fns';

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { id: employeeId, organizationId } = req.user;
  const now = new Date();
  const todayDate = startOfDay(now);

  try {
    const existingRecord = await AttendanceRecord.findOne({
      employeeId,
      date: todayDate,
    });

    if (existingRecord) {
      if (!existingRecord.clockOutTime) {
        return res.status(409).json({ error: 'Already clocked in for today.' });
      }
      return res.status(409).json({ error: 'You have already completed a work session for today. Contact HR for adjustments.' });
    }

    const newRecord = new AttendanceRecord({
      employeeId,
      organizationId,
      date: todayDate,
      clockInTime: now,
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
    if (error.code === 11000) {
        return res.status(409).json({ error: 'An attendance record for today might already exist or there was a conflict.' });
    }
    return res.status(500).json({ error: 'Internal Server Error during clock-in.' });
  }
}

export default withAuth(handler);
