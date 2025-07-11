import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import SupportTicket, { type TicketPriority } from '@/models/SupportTicket';
import { verifyToken } from '@/lib/jwt';

type TicketRequestBody = {
  subject: string;
  description: string;
  priority: TicketPriority;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
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

  const { employeeId, organizationId } = decodedToken;
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
}
