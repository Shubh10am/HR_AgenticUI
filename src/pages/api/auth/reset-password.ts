import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { recordAudit } from '@/services/audit/record';
import { consumePasswordToken, MIN_PASSWORD_LENGTH } from '@/services/auth/password-tokens';

/** Sets a password from an invite or reset link. The token is single-use. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { token, newPassword } = req.body ?? {};
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'This link is invalid. Ask for a new one.' });
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
  }

  try {
    await dbConnect();
    const employee = await consumePasswordToken(token, newPassword);
    if (!employee) {
      return res.status(400).json({ error: 'This link is invalid or has expired. Ask for a new one.' });
    }
    await recordAudit(req, {
      id: String(employee._id),
      name: employee.name,
      email: employee.email,
      role: employee.role,
      organizationId: String(employee.organizationId),
    }, 200);
    return res.status(200).json({ message: 'Your password has been set. You can sign in now.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
