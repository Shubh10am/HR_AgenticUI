
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { IEmployee } from '@/models/Employee';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import mongoose from 'mongoose';

// Sanitize employee object to remove passwordHash
const sanitizeEmployee = (employee: IEmployee) => {
  const { passwordHash, ...sanitized } = employee.toObject();
  return sanitized;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { employeeId } = decodedToken;
  const { name } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }

  try {
    const employeeToUpdate = await Employee.findById(employeeId);
    if (!employeeToUpdate) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    employeeToUpdate.name = name.trim();
    await employeeToUpdate.save();

    // After saving, re-create the user object that matches the one in AuthContext
    const updatedUser = {
        id: employeeToUpdate._id.toString(),
        name: employeeToUpdate.name,
        email: employeeToUpdate.email,
        role: employeeToUpdate.role,
        organizationId: employeeToUpdate.organizationId.toString(),
    };

    return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
