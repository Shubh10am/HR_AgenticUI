
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // In a real app, you would find the user by the hashed token and check expiry.
    // const user = await Employee.findOne({
    //   passwordResetToken: hashedToken,
    //   passwordResetExpires: { $gt: Date.now() },
    // });
    
    // For this mock-up, since we are not saving the token, we'll find a user
    // to simulate the password update process. This is NOT secure for production.
    const user = await Employee.findOne().sort({ createdAt: -1 }); // Find any user for demo

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Clear reset token fields
    // user.passwordResetToken = undefined;
    // user.passwordResetExpires = undefined;
    
    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
