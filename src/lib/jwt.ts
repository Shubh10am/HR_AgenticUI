
import jwt from 'jsonwebtoken';
import type { IEmployee } from '@/models/Employee';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}

export interface JwtPayload {
  employeeId: string;
  email: string;
  role: IEmployee['role'];
  organizationId: string;
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
