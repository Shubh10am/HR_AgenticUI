
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { issuePasswordToken, passwordLink, RESET_TTL_MS } from '@/services/auth/password-tokens';
import { sendPasswordResetEmail } from '@/services/mailerService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await Employee.findOne({ email: email.toLowerCase() });
    
    // Always return a success message to prevent user enumeration attacks.
    // The email will only be sent if the user actually exists.
    if (user) {
      const resetToken = await issuePasswordToken(user, RESET_TTL_MS);
      const resetURL = passwordLink(req, resetToken, false);

      // Fire and forget the email sending
      sendPasswordResetEmail(user, resetURL);
    }
    
    return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    // Don't leak server errors. The success message is sufficient.
    return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
  }
}
