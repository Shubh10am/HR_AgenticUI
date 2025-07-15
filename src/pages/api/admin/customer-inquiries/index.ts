
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import ContactSubmission from '@/models/ContactSubmission';
import DemoRequest from '@/models/DemoRequest';
import { verifyToken } from '@/lib/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  if (!decodedToken || (decodedToken.role !== 'SuperAdmin' && decodedToken.role !== 'Admin')) {
    return res.status(403).json({ error: 'Forbidden: Access restricted.' });
  }

  const { type } = req.query;

  try {
    if (type === 'contact') {
      const submissions = await ContactSubmission.find({}).sort({ createdAt: -1 });
      return res.status(200).json(submissions);
    } else if (type === 'demo') {
      const requests = await DemoRequest.find({}).sort({ createdAt: -1 });
      return res.status(200).json(requests);
    } else {
      return res.status(400).json({ error: 'Invalid inquiry type specified.' });
    }
  } catch (error) {
    console.error(`Error fetching inquiries of type ${type}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
