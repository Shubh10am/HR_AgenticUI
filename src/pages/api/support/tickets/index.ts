
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import SupportTicket, { type TicketPriority, type ISupportTicket } from '@/models/SupportTicket';
import { verifyToken, type JwtPayload } from '@/lib/jwt';

type TicketRequestBody = {
  subject: string;
  description: string;
  priority: TicketPriority;
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
    const { subject, description, priority } = req.body as TicketRequestBody;

    if (!subject || !description || !priority) {
      return res.status(400).json({ error: 'Subject, description, and priority are required.' });
    }

    try {
      const newTicket = new SupportTicket({
        organizationId,
        submittedBy: employeeId,
        subject,
        description,
        priority,
        status: 'Open',
      });

      await newTicket.save();

      return res.status(201).json({
        message: 'Support ticket created successfully.',
        ticketId: newTicket._id.toString(),
      });
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'GET') {
    try {
      const tickets = await SupportTicket.find({ submittedBy: employeeId })
        .sort({ updatedAt: -1 }) // Show most recently updated tickets first
        .lean();
      
      return res.status(200).json(tickets);
    } catch (error) {
      console.error('Error fetching user support tickets:', error);
      return res.status(500).json({ error: 'Internal Server Error fetching tickets.' });
    }
  } else {
     res.setHeader('Allow', ['GET', 'POST']);
     return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
