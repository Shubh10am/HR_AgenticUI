import type { NextApiRequest } from 'next';
import type { IEmployee } from '@/models/Employee';
import { sendEmployeeInviteEmail } from '@/services/mailerService';
import { INVITE_TTL_MS, issuePasswordToken, passwordLink } from './password-tokens';

/** Issues a 72-hour set-password link and emails it to the employee. Never throws. */
export async function sendInvite(req: NextApiRequest, employee: IEmployee, organizationName: string): Promise<boolean> {
  try {
    const token = await issuePasswordToken(employee, INVITE_TTL_MS);
    await sendEmployeeInviteEmail({ name: employee.name, email: employee.email }, organizationName, passwordLink(req, token, true));
    return true;
  } catch (error) {
    console.error(`[invite] Could not invite ${employee.email}:`, error);
    return false;
  }
}
