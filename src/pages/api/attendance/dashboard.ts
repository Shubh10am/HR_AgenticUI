
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { type IEmployee } from '@/models/Employee';
import AttendanceRecord from '@/models/AttendanceRecord';
import LeaveRequest from '@/models/LeaveRequest';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface PresentEmployee {
  _id: string;
  name: string;
  department?: string;
  clockInTime: string;
}

interface AbsentEmployee {
  _id: string;
  name: string;
  department?: string;
  leaveType?: string; // e.g., 'Sick', 'Annual'
}

interface DashboardData {
  presentEmployees: PresentEmployee[];
  absentEmployees: AbsentEmployee[];
}

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse<DashboardData | { error: string }>
) {
  const { organizationId } = req.user;

  try {
    const now = new Date();
    const serverTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get server's actual timezone
    const todayStart = startOfDay(toZonedTime(now, serverTimeZone));
    const todayEnd = endOfDay(toZonedTime(now, serverTimeZone));

    // 1. Get all employees in the organization
    const allEmployees = await Employee.find({ organizationId }).lean();

    // 2. Get today's attendance records
    const todaysAttendance = await AttendanceRecord.find({
      organizationId,
      date: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    }).lean();
    
    // 3. Get today's approved leave requests
    const todaysLeaves = await LeaveRequest.find({
        organizationId,
        status: 'Approved',
        startDate: { $lte: todayEnd },
        endDate: { $gte: todayStart },
    }).lean();
    
    const presentEmployeeIds = new Set(todaysAttendance.map(a => a.employeeId.toString()));
    const onLeaveEmployeeIds = new Set(todaysLeaves.map(l => l.employeeId.toString()));
    
    const presentEmployees: PresentEmployee[] = todaysAttendance.map(record => {
        const employee = allEmployees.find(e => e._id.toString() === record.employeeId.toString());
        return {
            _id: record.employeeId.toString(),
            name: employee?.name || 'Unknown',
            department: employee?.department,
            clockInTime: record.clockInTime.toISOString(),
        };
    }).sort((a,b) => a.name.localeCompare(b.name));

    const absentEmployees: AbsentEmployee[] = allEmployees
        .filter(emp => !presentEmployeeIds.has(emp._id.toString()))
        .map(emp => {
            const isOnLeave = onLeaveEmployeeIds.has(emp._id.toString());
            const leaveDetails = isOnLeave ? todaysLeaves.find(l => l.employeeId.toString() === emp._id.toString()) : null;
            
            return {
                _id: emp._id.toString(),
                name: emp.name,
                department: emp.department,
                leaveType: isOnLeave ? leaveDetails?.leaveType : undefined,
            };
        }).sort((a,b) => a.name.localeCompare(b.name));


    res.status(200).json({ presentEmployees, absentEmployees });
  } catch (error: any) {
    console.error('Error fetching attendance dashboard data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withAuth(handler, ['Admin', 'HR']);
