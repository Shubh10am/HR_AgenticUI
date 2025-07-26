
import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { getGmailService } from '@/services/google';
import mongoose from 'mongoose';

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { id: messageId } = req.query;

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (typeof messageId !== 'string' || !messageId) {
    return res.status(400).json({ error: 'Message ID is required.' });
  }

  try {
    const gmail = await getGmailService(req.user.id);
    if (!gmail) {
      return res.status(401).json({ error: 'Google authentication required.' });
    }

    await gmail.users.messages.delete({
      userId: 'me',
      id: messageId,
    });

    res.status(200).json({ message: 'Email deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting email:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to delete email from Google.' });
  }
}

export default withAuth(handler);
