
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import AttendanceRecord, { type IAttendanceRecord } from '@/models/AttendanceRecord';
import Employee, { type IEmployee } from '@/models/Employee'; // Ensure Employee is imported
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import { format } from 'date-fns';

interface PopulatedAttendanceRecord extends Omit<IAttendanceRecord, 'employeeId'> {
  employeeId: IEmployee;
}

export interface TransformedAttendanceRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department?: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // HH:mm AM/PM
  clockOut?: string; // HH:mm AM/PM
  hoursWorked?: string; // Xh Ym (display string)
  status: 'Present' | 'Late' | 'EarlyDeparture' | 'Unknown'; // Simplified status from record
  notes?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TransformedAttendanceRecord[] | { error: string }>
) {
  if (req.method !== 'GET') {
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

  const { employeeId: currentUserId, organizationId, role } = decodedToken;

  try {
    let query: any = {};
    if (role === 'Admin' || role === 'HR') {
      query.organizationId = organizationId;
    } else {
      query.employeeId = currentUserId;
    }

    // Add date range filtering if provided (optional for now, can be added later)
    // const { startDate, endDate } = req.query;
    // if (startDate && endDate) {
    //   query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    // }
    
    const records: PopulatedAttendanceRecord[] = await AttendanceRecord.find(query)
      .populate<{ employeeId: IEmployee }>({
        path: 'employeeId',
        select: 'name department', // Select name and department from Employee
      })
      .sort({ date: -1, clockInTime: -1 }) // Sort by date desc, then clockInTime desc
      .lean();

    const transformedRecords: TransformedAttendanceRecord[] = records.map(record => {
      let hoursWorkedDisplay: string | undefined = undefined;
      if (record.hoursWorked !== undefined) {
        const hours = Math.floor(record.hoursWorked / 60);
        const minutes = record.hoursWorked % 60;
        hoursWorkedDisplay = `${hours}h ${minutes}m`;
      }
      
      // Basic status from record, can be enhanced
      let displayStatus: TransformedAttendanceRecord['status'] = 'Unknown';
      if (record.clockInTime && record.clockOutTime) {
        displayStatus = record.status || 'Present';
      } else if (record.clockInTime) {
        displayStatus = record.status || 'Present'; // Still clocked in
      }


      return {
        id: record._id.toString(),
        employeeName: record.employeeId?.name || 'N/A',
        employeeId: record.employeeId?._id?.toString() || 'N/A',
        department: record.employeeId?.department || 'N/A',
        date: format(new Date(record.date), 'yyyy-MM-dd'),
        clockIn: record.clockInTime ? format(new Date(record.clockInTime), 'hh:mm a') : undefined,
        clockOut: record.clockOutTime ? format(new Date(record.clockOutTime), 'hh:mm a') : undefined,
        hoursWorked: hoursWorkedDisplay,
        status: displayStatus,
        notes: record.notes,
      };
    });

    return res.status(200).json(transformedRecords);
  } catch (error: any) {
    console.error('Error fetching attendance records:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
