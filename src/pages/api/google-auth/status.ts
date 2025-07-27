
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import GoogleApiCredential from '@/models/GoogleApiCredential';

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { id: employeeId } = req.user;

  try {
    const credential = await GoogleApiCredential.findOne({ employeeId });

    if (credential && credential.accessToken) {
      // The getAuthenticatedClient service handles token refreshes automatically.
      // So, if a credential exists, we can consider the user authenticated for Google services.
      // A more robust check might involve making a lightweight API call to Google to verify the token,
      // but for this app's purpose, checking for existence is sufficient and faster.
      return res.status(200).json({ isAuthenticated: true });
    }
    
    return res.status(200).json({ isAuthenticated: false });

  } catch (error) {
    console.error('Error checking Google API auth status:', error);
    return res.status(500).json({ error: 'Internal Server Error', isAuthenticated: false });
  }
}

export default withAuth(handler);

    