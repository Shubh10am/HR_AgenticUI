
import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, type JwtPayload } from '@/lib/jwt';


const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_BASE_URL } = process.env;

export function getGoogleAuthClient() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXT_PUBLIC_BASE_URL) {
    throw new Error('Google OAuth credentials or base URL are missing from environment variables.');
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${NEXT_PUBLIC_BASE_URL}/api/google-auth/callback`
  );
}


const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.readonly'
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || req.cookies.authToken;
  if (!authHeader) {
      return res.status(401).json({ error: 'Authorization token not found.' });
  }
  
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const oauth2Client = getGoogleAuthClient();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force refresh token to be sent
    scope: SCOPES,
    state: token, // Pass the JWT as state
  });

  res.redirect(authUrl);
}

    