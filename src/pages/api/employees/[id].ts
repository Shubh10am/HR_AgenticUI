
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { EmployeeRole, IEmployee } from '@/models/Employee';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import mongoose from 'mongoose';
import Organization from '@/models/Organization';
import AttendanceRecord from '@/models/AttendanceRecord';


const sanitizeEmployee = (employee: IEmployee) => {
  const { passwordHash, ...sanitized } = employee.toObject();
  return sanitized;
};

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { id } = req.query; // Employee ID to be acted upon

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid employee ID format.' });
  }
  
  const { id: currentUserId, organizationId: currentUserOrgId } = req.user;

  if (req.method === 'GET') {
    try {
      const employee = await Employee.findById(id).populate('organizationId', 'name status');
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      if (employee.organizationId._id.toString() !== currentUserOrgId) {
        return res.status(403).json({ error: 'Forbidden: Employee does not belong to your organization.' });
      }
      
      const attendanceRecords = await AttendanceRecord.find({ employeeId: id }).sort({ date: -1 });

      const response = {
        employee: {
          ...sanitizeEmployee(employee),
          organization: employee.organizationId
        },
        attendance: attendanceRecords.map(r => ({
          date: r.date.toISOString(),
          status: r.status || 'Present',
          hoursWorked: r.hoursWorked || 0
        })),
      };

      return res.status(200).json(response);

    } catch(error) {
       console.error('Error fetching employee details:', error);
       return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (req.method === 'DELETE') {
    if (currentUserId === id) {
      return res.status(400).json({ error: 'Admins cannot delete their own account.' });
    }

    try {
      const employeeToDelete = await Employee.findById(id);
      if (!employeeToDelete) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      if (employeeToDelete.organizationId.toString() !== currentUserOrgId) {
        return res.status(403).json({ error: 'Forbidden: Employee does not belong to your organization.' });
      }

      await Employee.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Employee deleted successfully.' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } 
  
  if (req.method === 'PUT') {
    try {
      const employeeToUpdate = await Employee.findById(id);
      if (!employeeToUpdate) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      if (employeeToUpdate.organizationId.toString() !== currentUserOrgId) {
        return res.status(403).json({ error: 'Forbidden: Employee does not belong to your organization.' });
      }

      const { name, role, department } = req.body;

      if (!name && !role && department === undefined) {
        return res.status(400).json({ error: 'At least one field (name, role, department) must be provided to update.' });
      }

      if (role && (typeof role !== 'string' || !role.trim())) {
        return res.status(400).json({ error: 'Role must be a non-empty string.' });
      }

      if (name) employeeToUpdate.name = name;
      if (role) employeeToUpdate.role = role as EmployeeRole;
      if (department !== undefined) employeeToUpdate.department = department;

      await employeeToUpdate.save();

      return res.status(200).json(sanitizeEmployee(employeeToUpdate));
    } catch (error) {
      console.error('Error updating employee:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  res.setHeader('Allow', ['GET', 'DELETE', 'PUT']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

export default withAuth(handler, 'Admin');
