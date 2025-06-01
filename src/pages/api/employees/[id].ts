
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import mongoose from 'mongoose';


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
    // Placeholder for Update Employee - To be implemented later
    // For now, ensure only Admins can attempt this.
    if (currentUserRole !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: Only Admins can update employees.' });
    }
    // Actual update logic will go here in a future iteration.
    // Example:
    // const { name, role } = req.body;
    // const updateData: Partial<IEmployee> = {};
    // if (name) updateData.name = name;
    // if (role && ['Admin', 'HR', 'Employee'].includes(role)) updateData.role = role as EmployeeRole;
    // ... find employee, check org, update, save, sanitize, return ...
    return res.status(501).json({ error: 'Update functionality not yet implemented.' });
    
  } else {
    res.setHeader('Allow', ['DELETE', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

