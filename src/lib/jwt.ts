
import jwt from 'jsonwebtoken';
import type { IEmployee, EmployeeRole } from '@/models/Employee';
import type { AdminRole } from '@/models/Admin';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}

export interface JwtPayload {
  employeeId: string; // Can be Employee ID or Admin ID
  email: string;
  role: EmployeeRole | AdminRole;
  organizationId: string | null; // Null for SuperAdmin
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: '1d', // Token expires in 1 day, adjust as needed
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}
