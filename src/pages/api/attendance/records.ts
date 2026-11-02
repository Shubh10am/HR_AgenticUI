
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import AttendanceRecord, { type IAttendanceRecord } from '@/models/AttendanceRecord';
import Employee, { type IEmployee } from '@/models/Employee';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { dayKeyOf, isDayKey, storedDateOf } from '@/lib/attendance';

const DEFAULT_RANGE_DAYS = 90;
const MAX_RECORDS = 5000;

interface PopulatedAttendanceRecord extends Omit<IAttendanceRecord, 'employeeId'> {
  employeeId: IEmployee;
}

export interface TransformedAttendanceRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department?: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // ISO String
  clockOut?: string; // ISO String
  hoursWorked?: string; // Xh Ym (display string)
  status: 'Present' | 'Late' | 'EarlyDeparture' | 'Unknown'; // Simplified status from record
  notes?: string;
}

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
    // Bounded by date so the list stays fast as history grows: ?from=&to= (YYYY-MM-DD), default the last 90 days.
    const to = isDayKey(req.query.to) ? req.query.to : dayKeyOf();
    const from = isDayKey(req.query.from) ? req.query.from : dayKeyOf(new Date(storedDateOf(to).getTime() - DEFAULT_RANGE_DAYS * 86_400_000));
    query.date = { $gte: storedDateOf(from), $lte: storedDateOf(to) };
    
    const records: PopulatedAttendanceRecord[] = await AttendanceRecord.find(query)
      .populate<{ employeeId: IEmployee }>({
        path: 'employeeId',
        model: Employee,
        select: 'name department',
      })
      .sort({ date: -1, clockInTime: -1 })
      .limit(MAX_RECORDS)
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
        date: new Date(record.date).toISOString().slice(0, 10),
        clockIn: record.clockInTime ? new Date(record.clockInTime).toISOString() : undefined,
        clockOut: record.clockOutTime ? new Date(record.clockOutTime).toISOString() : undefined,
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
