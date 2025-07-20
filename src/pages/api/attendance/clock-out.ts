
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import AttendanceRecord from '@/models/AttendanceRecord';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { differenceInMinutes } from 'date-fns';

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { id: employeeId } = req.user;
  const now = new Date();
  
  try {
    // Find the most recent clock-in record for this employee that hasn't been clocked out yet.
    // This is more robust than relying on matching the exact UTC date.
    const record = await AttendanceRecord.findOne({
      employeeId,
      clockOutTime: { $exists: false },
    }).sort({ clockInTime: -1 }); // Get the latest one

    if (!record) {
      return res.status(404).json({ error: 'No active clock-in record found to clock out.' });
    }

    record.clockOutTime = now;
    record.hoursWorked = differenceInMinutes(record.clockOutTime, record.clockInTime);
    
    await record.save();

    return res.status(200).json({
      message: 'Clocked out successfully.',
      record: {
        id: record._id,
        clockInTime: record.clockInTime,
        clockOutTime: record.clockOutTime,
        hoursWorked: record.hoursWorked,
        date: record.date,
      },
    });
  } catch (error: any) {
    console.error('Clock-out error:', error);
    return res.status(500).json({ error: 'Internal Server Error during clock-out.' });
  }
}

export default withAuth(handler);
