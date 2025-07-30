
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import DemoRequest from '@/models/DemoRequest';
import { sendDemoConfirmation, sendDemoAdminNotification } from '@/services/mailerService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  try {
    const { name, companyName, email, phone, companySize, message } = req.body;

    if (!name || !companyName || !email || !companySize) {
      return res.status(400).json({ error: 'Name, company name, email, and company size are required.' });
    }

    const newRequest = new DemoRequest({
      name,
      companyName,
      email,
      phone: phone || '',
      companySize,
      message: message || '',
    });

    await newRequest.save();

    // Send email notifications (fire-and-forget)
    sendDemoConfirmation(newRequest); // To the user
    sendDemoAdminNotification(newRequest); // To the admin

    res.status(201).json({ message: 'Demo request received successfully.' });
  } catch (error: any) {
    console.error('Demo request error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
