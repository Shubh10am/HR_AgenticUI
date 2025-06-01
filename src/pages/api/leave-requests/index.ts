
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import LeaveRequest, { type LeaveType, type ILeaveRequest } from '@/models/LeaveRequest';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import { parseISO } from 'date-fns';

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
    const { leaveType, startDate, endDate, reason } = req.body as LeaveRequestBody;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Missing required fields for leave request.' });
    }

    try {
      const parsedStartDate = parseISO(startDate);
      const parsedEndDate = parseISO(endDate);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format for start or end date.' });
      }

      if (parsedEndDate < parsedStartDate) {
        return res.status(400).json({ error: 'End date cannot be before start date.' });
      }
      
      // Optional: Check for overlapping leave requests for the same employee
      const overlappingLeave = await LeaveRequest.findOne({
        employeeId,
        status: { $in: ['Pending', 'Approved'] }, // Consider only active or pending requests
        $or: [
          // New request is within an existing request
          { startDate: { $lte: parsedStartDate }, endDate: { $gte: parsedEndDate } },
          // New request starts during an existing request
          { startDate: { $lte: parsedStartDate }, endDate: { $gte: parsedStartDate, $lte: parsedEndDate } },
          // New request ends during an existing request
          { startDate: { $gte: parsedStartDate, $lte: parsedEndDate }, endDate: { $gte: parsedEndDate } },
          // New request envelops an existing request
          { startDate: { $gte: parsedStartDate }, endDate: { $lte: parsedEndDate } }
        ]
      });

      if (overlappingLeave) {
        return res.status(409).json({ error: 'You have an existing leave request that overlaps with these dates.' });
      }


      const newLeaveRequest = new LeaveRequest({
        employeeId,
        organizationId,
        leaveType,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        reason,
        status: 'Pending', // Default status
      });

      await newLeaveRequest.save();

      const responseRequest = newLeaveRequest.toObject() as Partial<ILeaveRequest>;
      delete responseRequest.organizationId; // Example of sanitizing if needed, though usually employeeId is main concern

      return res.status(201).json({
        message: 'Leave request submitted successfully.',
        leaveRequest: responseRequest,
      });
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }
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
