
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// In a real application, these should be securely stored in environment variables.
const ADMIN_USERNAME = 'Shubham';
const ADMIN_PASSWORD_HASH = '$Shubh@912513'; // Using the plain password as a mock "hash" for this prototype

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // NOTE: This is a simple, insecure comparison for prototyping purposes.
  // A real application should use a secure hashing algorithm like bcrypt.compare().
  const isUsernameValid = username === ADMIN_USERNAME;
  const isPasswordValid = password === ADMIN_PASSWORD_HASH;

  if (isUsernameValid && isPasswordValid) {
    // Create a mock session token. In a real app, use JWT or a secure session library.
    const mockToken = crypto.createHash('sha256').update(ADMIN_PASSWORD_HASH + new Date().toISOString()).digest('hex');
    
    // Set this token in environment variables for the client-side check
    process.env.NEXT_PUBLIC_ADMIN_AUTH_TOKEN = mockToken;

    res.status(200).json({ message: 'Login successful', token: mockToken });
  } else {
    res.status(401).json({ error: 'Invalid credentials.' });
  }
}
