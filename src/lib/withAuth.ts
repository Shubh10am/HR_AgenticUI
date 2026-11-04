// src/lib/withAuth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, type JwtPayload } from './jwt';
import dbConnect from './mongodb';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import Admin from '@/models/Admin';
import mongoose from 'mongoose';
import { AUDITED_METHODS, recordAudit } from '@/services/audit/record';
import { getPlatformSettingsSafe } from '@/services/platform/settings';
import { isPlatformAdmin } from './platform-admin';

type AuthenticatedUser = (JwtPayload & { id: string });

export interface NextApiRequestWithAuth extends NextApiRequest {
  user: AuthenticatedUser;
  /** Set by a handler acting for an anonymous author: the audit entry then names no one and keeps no IP. */
  auditAnonymously?: boolean;
}

type ApiHandler<T = any> = (
  req: NextApiRequestWithAuth,
  res: NextApiResponse<T>
) => void | Promise<void>;

type Role = 'SuperAdmin' | 'Admin' | 'HR' | 'Manager' | 'Employee' | 'Any';

export function withAuth(handler: ApiHandler, requiredRole: Role | Role[] = 'Any') {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    await dbConnect();

    // Check if the user is a platform Admin or a regular Employee
    let user;
    let organizationStatus: string | null = 'Active'; // Default to active for platform admins

    if (decodedToken.organizationId === null && (decodedToken.role === 'SuperAdmin' || decodedToken.role === 'Admin')) {
        user = await Admin.findById(decodedToken.employeeId).lean();
        // A platform admin has no organization, so their status check is effectively bypassed.
    } else if (decodedToken.organizationId) {
        user = await Employee.findById(decodedToken.employeeId).populate('organizationId', 'status').lean();
        if (user && user.organizationId) {
            organizationStatus = (user.organizationId as any).status;
        }
    } else {
        // This case handles users that are neither platform admins nor have an org ID, which is invalid.
        return res.status(403).json({ error: 'Forbidden: Invalid user configuration.' });
    }
    
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    // THIS IS THE CRITICAL SECURITY CHECK
    if (organizationStatus === 'Hold' || organizationStatus === 'Suspended') {
        return res.status(403).json({ error: `Forbidden: Your organization's account is ${organizationStatus}.` });
    }

    // Role check
    const rolesToCheck = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (requiredRole !== 'Any' && !rolesToCheck.includes(decodedToken.role)) {
         return res.status(403).json({ error: 'Forbidden: You do not have the necessary permissions.' });
    }

    // Maintenance mode locks out everyone except platform administrators.
    if (!isPlatformAdmin(decodedToken)) {
      const settings = await getPlatformSettingsSafe();
      if (settings?.maintenanceMode) {
        return res.status(503).json({ error: settings.maintenanceMessage, maintenance: true });
      }
    }

    // Attach user information to the request object for the handler
    const reqWithAuth = req as NextApiRequestWithAuth;
    reqWithAuth.user = { ...decodedToken, id: decodedToken.employeeId };

    // Every change made by a signed-in user goes to the audit log once the response is sent.
    if (AUDITED_METHODS.has((req.method ?? '').toUpperCase())) {
      const startedAt = Date.now();
      res.once('finish', () => {
        // An anonymous community post must not be traceable through the audit log either.
        if ((req as NextApiRequestWithAuth).auditAnonymously) {
          void recordAudit(req, { id: 'anonymous', name: 'Anonymous colleague', organizationId: decodedToken.organizationId }, res.statusCode, Date.now() - startedAt, { anonymous: true });
          return;
        }
        void recordAudit(req, {
          id: decodedToken.employeeId,
          name: decodedToken.name,
          email: decodedToken.email,
          role: decodedToken.role,
          organizationId: decodedToken.organizationId,
        }, res.statusCode, Date.now() - startedAt);
      });
    }

    return handler(reqWithAuth, res);
  };
}
