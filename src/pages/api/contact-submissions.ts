
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import ContactSubmission from '@/models/ContactSubmission';
import { sendContactConfirmation, sendContactAdminNotification } from '@/services/mailerService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required fields.' });
    }

    const newSubmission = new ContactSubmission({
      name,
      email,
      phone: phone || '',
      subject,
      message,
    });

    await newSubmission.save();

    // Send email notifications (fire-and-forget)
    sendContactConfirmation(newSubmission); // To the user
    sendContactAdminNotification(newSubmission); // To the admin

    res.status(201).json({ message: 'Contact submission received successfully.' });
  } catch (error: any) {
    console.error('Contact submission error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
