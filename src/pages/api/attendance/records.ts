
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import AttendanceRecord, { type IAttendanceRecord } from '@/models/AttendanceRecord';
import Employee, { type IEmployee } from '@/models/Employee';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { format as formatTz } from 'date-fns-tz';
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

const IST_TIMEZONE = 'Asia/Kolkata';

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse<TransformedAttendanceRecord[] | { error: string }>
) {
  const { id: currentUserId, organizationId, role } = req.user;

  try {
    let query: any = {};
    if (role === 'Admin' || role === 'HR') {
      query.organizationId = organizationId;
    } else {
      query.employeeId = currentUserId;
    }
    
    const records: PopulatedAttendanceRecord[] = await AttendanceRecord.find(query)
      .populate<{ employeeId: IEmployee }>({
        path: 'employeeId',
        model: Employee,
        select: 'name department',
      })
      .sort({ date: -1, clockInTime: -1 })
      .lean();

    const transformedRecords: TransformedAttendanceRecord[] = records.map(record => {
      let hoursWorkedDisplay: string | undefined = undefined;
      if (record.hoursWorked !== undefined && record.hoursWorked !== null) {
        const hours = Math.floor(record.hoursWorked / 60);
        const minutes = record.hoursWorked % 60;
        hoursWorkedDisplay = `${hours}h ${minutes}m`;
      }
      
      let displayStatus: TransformedAttendanceRecord['status'] = 'Unknown';
      if (record.clockInTime) {
        displayStatus = record.status || 'Present';
      }

      return {
        id: record._id.toString(),
        employeeName: record.employeeId?.name || 'N/A',
        employeeId: record.employeeId?._id?.toString() || 'N/A',
        department: record.employeeId?.department || 'N/A',
        date: format(new Date(record.date), 'yyyy-MM-dd'),
        clockIn: record.clockInTime ? formatTz(new Date(record.clockInTime), 'hh:mm a', { timeZone: IST_TIMEZONE }) : undefined,
        clockOut: record.clockOutTime ? formatTz(new Date(record.clockOutTime), 'hh:mm a', { timeZone: IST_TIMEZONE }) : undefined,
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

export default withAuth(handler); // Open to any authenticated user
