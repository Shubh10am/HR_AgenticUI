
import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import GoogleApiCredential from '@/models/GoogleApiCredential';

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id: employeeId } = req.user;

  try {
    const result = await GoogleApiCredential.deleteOne({ employeeId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No Google account connected for this user.' });
    }

    // Also clear the API key from local storage on client side if necessary,
    // though this response is mainly for server state change.
    res.status(200).json({ message: 'Google account disconnected successfully.' });

  } catch (error) {
    console.error('Error disconnecting Google account:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withAuth(handler);
