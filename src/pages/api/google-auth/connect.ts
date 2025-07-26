
import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, type JwtPayload } from '@/lib/jwt';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_BASE_URL } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXT_PUBLIC_BASE_URL) {
  throw new Error('Google OAuth credentials or base URL are missing from environment variables.');
}

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${NEXT_PUBLIC_BASE_URL}/api/google-auth/callback`
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.readonly'
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // We need to pass the user's JWT in the state to identify them in the callback
  const authHeader = req.headers.authorization || req.cookies.authToken;
  if (!authHeader) {
      return res.status(401).json({ error: 'Authorization token not found.' });
  }
  
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force refresh token to be sent
    scope: SCOPES,
    state: token, // Pass the JWT as state
  });

  res.redirect(authUrl);
}
