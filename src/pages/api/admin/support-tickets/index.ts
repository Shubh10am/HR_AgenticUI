
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import SupportTicket, { type ISupportTicket } from '@/models/SupportTicket';
import Employee, { type IEmployee } from '@/models/Employee';
import Organization, { type IOrganization } from '@/models/Organization';
import { verifyToken } from '@/lib/jwt';

interface PopulatedTicket extends Omit<ISupportTicket, 'submittedBy' | 'organizationId'> {
  submittedBy: IEmployee;
  organizationId: IOrganization;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken || decodedToken.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to SuperAdmins.' });
  }

  try {
    const tickets = await SupportTicket.find({})
      .sort({ updatedAt: -1 })
      .populate<{ submittedBy: IEmployee }>({
        path: 'submittedBy',
        select: 'name',
        model: Employee,
      })
      .populate<{ organizationId: IOrganization }>({
        path: 'organizationId',
        select: 'name',
        model: Organization,
      })
      .lean();

    const formattedTickets = (tickets as PopulatedTicket[]).map(ticket => ({
      _id: ticket._id.toString(),
      subject: ticket.subject,
      customerName: ticket.submittedBy?.name || 'Unknown User',
      organizationName: ticket.organizationId?.name || 'Unknown Organization',
      status: ticket.status,
      priority: ticket.priority,
      updatedAt: ticket.updatedAt.toISOString(),
    }));

    return res.status(200).json(formattedTickets);
  } catch (error) {
    console.error("Error fetching support tickets for admin:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
