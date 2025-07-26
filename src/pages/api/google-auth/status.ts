
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

    if (credential && credential.accessToken && credential.expiryDate > Date.now()) {
      // Token exists and is not expired
      return res.status(200).json({ isAuthenticated: true });
    }
    
    // If token is expired but we have a refresh token, we could try refreshing it here.
    // For simplicity, we'll just report as unauthenticated and let the user re-authorize.
    
    return res.status(200).json({ isAuthenticated: false });

  } catch (error) {
    console.error('Error checking Google API auth status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withAuth(handler);
