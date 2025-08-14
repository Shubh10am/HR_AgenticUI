
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import crypto from 'crypto';
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
      const resetToken = crypto.randomBytes(32).toString('hex');
      const passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // Token expires in 10 minutes

      // In a real app, you would save `passwordResetToken` and `passwordResetExpires` to the user document.
      // For this mock, we will just generate the link and send it.
      // user.passwordResetToken = passwordResetToken;
      // user.passwordResetExpires = passwordResetExpires;
      // await user.save();
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const resetURL = `${protocol}://${host}/reset-password?token=${resetToken}`;
      
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
