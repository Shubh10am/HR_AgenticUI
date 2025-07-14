
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import Admin from '@/models/Admin';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid Ticket ID.' });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken || (decodedToken.role !== 'SuperAdmin' && decodedToken.role !== 'Admin')) {
    return res.status(403).json({ error: 'Forbidden: Access restricted to platform administrators.' });
  }

  if (req.method === 'GET') {
    try {
      const ticket = await SupportTicket.findById(id)
        .populate({ path: 'submittedBy', model: Employee, select: 'name email' })
        .populate({ path: 'organizationId', model: Organization, select: 'name' })
        .populate({ path: 'assignedTo', model: Admin, select: 'name email' })
        .lean();

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }

      return res.status(200).json(ticket);
    } catch (error) {
      console.error(`Error fetching ticket ${id}:`, error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const ticket = await SupportTicket.findById(id);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }
      
      const { status, assignedTo, resolution } = req.body;
      
      if (status) ticket.status = status;
      if (assignedTo !== undefined) ticket.assignedTo = assignedTo ? new mongoose.Types.ObjectId(assignedTo._id) : undefined;
      if (resolution) ticket.resolution = resolution;

      await ticket.save();

      const updatedTicket = await ticket.populate([
        { path: 'submittedBy', model: Employee, select: 'name email' },
        { path: 'organizationId', model: Organization, select: 'name' },
        { path: 'assignedTo', model: Admin, select: 'name email' }
      ]);
      
      return res.status(200).json(updatedTicket);
    } catch (error) {
      console.error(`Error updating ticket ${id}:`, error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}
