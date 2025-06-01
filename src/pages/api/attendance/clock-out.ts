
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import AttendanceRecord from '@/models/AttendanceRecord';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import { startOfDay, differenceInMinutes } from 'date-fns';

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

  const { employeeId } = decodedToken;
  const now = new Date();
  const todayDate = startOfDay(now);

  try {
    const record = await AttendanceRecord.findOne({
      employeeId,
      date: todayDate,
      clockOutTime: { $exists: false }, // Find a record that hasn't been clocked out yet
    });

    if (!record) {
      return res.status(404).json({ error: 'No active clock-in record found for today to clock out.' });
    }

    record.clockOutTime = now;
    // Calculate hours worked in minutes
    record.hoursWorked = differenceInMinutes(record.clockOutTime, record.clockInTime);
    
    // Optionally, update status based on hours worked or clockOutTime
    // e.g., if (record.hoursWorked < 8 * 60) record.status = 'EarlyDeparture';

    await record.save();

    return res.status(200).json({
      message: 'Clocked out successfully.',
      record: {
        id: record._id,
        clockInTime: record.clockInTime,
        clockOutTime: record.clockOutTime,
        hoursWorked: record.hoursWorked, // in minutes
        date: record.date,
      },
    });
  } catch (error: any) {
    console.error('Clock-out error:', error);
    return res.status(500).json({ error: 'Internal Server Error during clock-out.' });
  }
}
