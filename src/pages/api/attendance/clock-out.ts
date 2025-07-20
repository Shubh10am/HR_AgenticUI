
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import AttendanceRecord from '@/models/AttendanceRecord';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { differenceInMinutes } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { id: employeeId } = req.user;
  const now = new Date();
  
  // We find the record based on the server's UTC date
  const todayDate = utcToZonedTime(now, 'UTC');
  todayDate.setUTCHours(0, 0, 0, 0);


  try {
    const record = await AttendanceRecord.findOne({
      employeeId,
      date: todayDate,
      clockOutTime: { $exists: false },
    });

    if (!record) {
      return res.status(404).json({ error: 'No active clock-in record found for today to clock out.' });
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
