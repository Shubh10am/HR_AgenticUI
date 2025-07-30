
import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { getGmailService } from '@/services/google';

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

    // Use trash method which is the standard way to "delete" an email
    await gmail.users.messages.trash({
      userId: 'me',
      id: messageId,
    });

    res.status(200).json({ message: 'Email moved to trash successfully.' });
  } catch (error: any) {
    console.error('Error moving email to trash:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to move email to trash in Google.' });
  }
}

export default withAuth(handler);
