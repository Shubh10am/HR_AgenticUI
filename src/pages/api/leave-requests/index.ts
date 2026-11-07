
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import LeaveRequest, { type LeaveType } from '@/models/LeaveRequest';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import { submitLeave } from '@/services/leave';
import { ApiError } from '@/lib/api-route';
import { dayKeyOf } from '@/lib/attendance';

/** The calendar day (in the organisation's time zone) a date picker meant. */
const toDayKey = (value: unknown) => {
  const text = String(value ?? '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '' : dayKeyOf(date);
};

type LeaveRequestBody = {
  leaveType: LeaveType;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  reason: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  if (req.method === 'POST') {
    // Leave now goes through the leave service, so balances are checked and it is routed for approval.
    if (!organizationId) return res.status(400).json({ error: 'Leave belongs to an organisation.' });
    try {
      const { leaveType, startDate, endDate, reason } = req.body as LeaveRequestBody;
      const viewer = { id: String(employeeId), organizationId: String(organizationId), role: decodedToken.role, name: decodedToken.name ?? '' };
      const leaveRequest = await submitLeave(viewer, { leaveType, startDate: toDayKey(startDate), endDate: toDayKey(endDate), reason });
      return res.status(201).json({ message: 'Leave request submitted for approval.', leaveRequest });
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
      console.error('Error submitting leave request:', error);
      return res.status(500).json({ error: 'Internal Server Error while submitting leave request.' });
    }
  } else if (req.method === 'GET') {
    // GET request to fetch leave requests for the authenticated user (or all for admin/hr)
    try {
      let query: any = { employeeId }; // Default to fetching user's own requests

      // If user is Admin or HR, they might be able to see all requests for their organization
      // This part requires more robust role checking and potentially filtering options
      // For now, let's keep it simple: users fetch their own.
      // if (decodedToken.role === 'Admin' || decodedToken.role === 'HR') {
      //   query = { organizationId };
      //   // Add query params for filtering (e.g., status, date range)
      // }
      
      const { status, sort = 'requestedAt_desc' } = req.query;
      if (status && typeof status === 'string') {
        query.status = status;
      }

      let sortOption: any = { requestedAt: -1 }; // Default sort: newest first
      if (typeof sort === 'string') {
        const [sortField, sortOrder] = sort.split('_');
        if (sortField && sortOrder) {
          sortOption = { [sortField]: sortOrder === 'desc' ? -1 : 1 };
        }
      }


      const leaveRequests = await LeaveRequest.find(query)
        .populate('employeeId', 'name email') // Populate basic employee info if needed by client
        .sort(sortOption)
        .lean(); // Use .lean() for faster queries if you don't need Mongoose documents

      return res.status(200).json(leaveRequests);

    } catch (error: any) {
        console.error('Error fetching leave requests:', error);
        return res.status(500).json({ error: 'Internal Server Error while fetching leave requests.' });
    }

  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
