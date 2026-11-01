import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { NextApiRequest } from 'next';
import Employee, { type IEmployee } from '@/models/Employee';

export const INVITE_TTL_MS = 72 * 60 * 60 * 1000;
export const RESET_TTL_MS = 30 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 8;

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

/** A random password nobody knows, for accounts waiting on an invite. */
export async function unusablePasswordHash(): Promise<string> {
  return bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
}

/**
 * Stores a fresh one-time token on the employee (replacing any earlier one) and
 * returns the raw token for the email link. Only the hash is saved.
 */
export async function issuePasswordToken(employee: IEmployee, ttlMs: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  employee.passwordResetToken = hashToken(token);
  employee.passwordResetExpires = new Date(Date.now() + ttlMs);
  await employee.save();
  return token;
}

/** The set-password page link for a token. */
export function passwordLink(req: NextApiRequest, token: string, invite: boolean): string {
  const protocol = (req.headers['x-forwarded-proto'] as string) || 'http';
  return `${protocol}://${req.headers.host}/reset-password?token=${token}${invite ? '&invite=1' : ''}`;
}

/**
 * Sets a new password using a one-time token, then burns the token.
 *
 * @returns The employee, or null when the token is unknown or expired.
 */
export async function consumePasswordToken(token: string, newPassword: string): Promise<IEmployee | null> {
  const tokenHash = hashToken(token);
  // strictQuery: 'throw' makes an out-of-date schema fail loudly instead of silently dropping
  // the token filter and matching some other account.
  const employee = await Employee.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } }).setOptions({ strictQuery: 'throw' });
  if (!employee || employee.passwordResetToken !== tokenHash || !employee.passwordResetExpires || employee.passwordResetExpires <= new Date()) return null;
  employee.passwordHash = await bcrypt.hash(newPassword, 10);
  employee.passwordResetToken = undefined;
  employee.passwordResetExpires = undefined;
  employee.passwordSetAt = new Date();
  await employee.save();
  return employee;
}
