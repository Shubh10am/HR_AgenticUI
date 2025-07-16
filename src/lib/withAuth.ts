// src/lib/withAuth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, type JwtPayload } from './jwt';
import dbConnect from './mongodb';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import Admin from '@/models/Admin';
import mongoose from 'mongoose';

type AuthenticatedUser = (JwtPayload & { id: string });

export interface NextApiRequestWithAuth extends NextApiRequest {
  user: AuthenticatedUser;
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
    } else {
        user = await Employee.findById(decodedToken.employeeId).populate('organizationId', 'status').lean();
        if (user && user.organizationId) {
            organizationStatus = (user.organizationId as any).status;
        }
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

    // Attach user information to the request object for the handler
    const reqWithAuth = req as NextApiRequestWithAuth;
    reqWithAuth.user = { ...decodedToken, id: decodedToken.employeeId };

    return handler(reqWithAuth, res);
  };
}
