
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import ContactSubmission from '@/models/ContactSubmission';
import DemoRequest from '@/models/DemoRequest';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, type } = req.query;

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID provided.' });
  }

  if (type !== 'contact' && type !== 'demo') {
    return res.status(400).json({ error: 'Invalid inquiry type specified.' });
  }
  
  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken || decodedToken.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Forbidden: Access restricted.' });
  }
  
  try {
    let result;
    if (type === 'contact') {
      result = await ContactSubmission.findByIdAndDelete(id);
    } else { // type === 'demo'
      result = await DemoRequest.findByIdAndDelete(id);
    }

    if (!result) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    return res.status(200).json({ message: 'Inquiry deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting inquiry (type: ${type}, id: ${id}):`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
