
import type { NextApiRequest, NextApiResponse } from 'next';
import { getGoogleAuthClient } from './connect'; // Import the configured OAuth2 client
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import dbConnect from '@/lib/mongodb';
import GoogleApiCredential from '@/models/GoogleApiCredential';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;

  if (typeof state !== 'string') {
    return res.status(400).send('Invalid state parameter.');
  }

  // The state should be our JWT
  const userPayload = verifyToken(state);
  if (!userPayload) {
    return res.status(401).send('Invalid or expired state token.');
  }

  if (typeof code !== 'string') {
    return res.status(400).send('Authorization code is missing.');
  }

  try {
    const oauth2Client = getGoogleAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    
    await dbConnect();
    
    if (!tokens.access_token || !tokens.expiry_date || !tokens.scope || !tokens.token_type) {
      throw new Error('Incomplete token data received from Google.');
    }

    await GoogleApiCredential.findOneAndUpdate(
      { employeeId: userPayload.employeeId },
      {
        employeeId: userPayload.employeeId,
        organizationId: userPayload.organizationId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token, // This may not always be present
        scope: tokens.scope,
        tokenType: tokens.token_type,
        expiryDate: tokens.expiry_date,
      },
      { upsert: true, new: true }
    );

    res.redirect('/integrations?connect=success');

  } catch (error: any) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
}

    