
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { IEmployee } from '@/models/Employee';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import mongoose from 'mongoose';

const sanitizeEmployee = (employee: IEmployee) => {
  const { passwordHash, ...sanitized } = employee.toObject();
  return sanitized;
};

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { id: employeeId } = req.user;
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

export default withAuth(handler);
