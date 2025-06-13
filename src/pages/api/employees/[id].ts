
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { EmployeeRole, IEmployee } from '@/models/Employee';
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
  await dbConnect();
  const { id } = req.query; // Employee ID to be acted upon

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid employee ID format.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { employeeId: currentUserId, organizationId: currentUserOrgId, role: currentUserRole } = decodedToken;

  if (req.method === 'DELETE') {
    if (currentUserRole !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: Only Admins can delete employees.' });
    }

    if (currentUserId === id) {
      return res.status(400).json({ error: 'Admins cannot delete their own account.' });
    }

    try {
      const employeeToDelete = await Employee.findById(id);
      if (!employeeToDelete) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      // Ensure the employee belongs to the admin's organization
      if (employeeToDelete.organizationId.toString() !== currentUserOrgId) {
        return res.status(403).json({ error: 'Forbidden: Employee does not belong to your organization.' });
      }

      await Employee.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Employee deleted successfully.' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'PUT') {
    if (currentUserRole !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: Only Admins can update employees.' });
    }

    try {
      const employeeToUpdate = await Employee.findById(id);
      if (!employeeToUpdate) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      if (employeeToUpdate.organizationId.toString() !== currentUserOrgId) {
        return res.status(403).json({ error: 'Forbidden: Employee does not belong to your organization.' });
      }

      const { name, role } = req.body;

      if (!name && !role) {
        return res.status(400).json({ error: 'At least one of name or role must be provided to update.' });
      }

      if (role && !['Admin', 'HR', 'Employee'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified.' });
      }

      // Apply updates
      if (name) employeeToUpdate.name = name;
      if (role) employeeToUpdate.role = role as EmployeeRole;

      await employeeToUpdate.save();

      return res.status(200).json(sanitizeEmployee(employeeToUpdate));
    } catch (error) {
      console.error('Error updating employee:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
   else {
    res.setHeader('Allow', ['DELETE', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

