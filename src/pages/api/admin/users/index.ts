
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import Admin, { type IAdmin, type AdminRole } from '@/models/Admin';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export interface AdminUserData {
  _id: string;
  name: string;
  email: string;
  role: 'SuperAdmin' | 'Admin' | 'HR' | 'Employee';
  organizationName: string;
  createdAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  if (req.method === 'GET') {
    if (decodedToken.role !== 'SuperAdmin') {
      return res.status(403).json({ error: 'Forbidden: Access restricted to platform administrators.' });
    }
    
    try {
      const employees = await Employee.find({}).populate('organizationId', 'name').sort({ createdAt: -1 });
      const admins = await Admin.find({}).sort({ createdAt: -1 });

      const employeeUsers: AdminUserData[] = employees.map(user => {
        const org = user.organizationId as any;
        return {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          organizationName: org?.name || 'N/A',
          createdAt: user.createdAt.toISOString(),
        };
      });

      const adminUsers: AdminUserData[] = admins.map(admin => ({
        _id: admin._id.toString(),
        name: admin.role, // Use role as name for platform admins
        email: admin.email,
        role: admin.role,
        organizationName: 'Platform',
        createdAt: admin.createdAt.toISOString(),
      }));

      const allUsers = [...adminUsers, ...employeeUsers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json(allUsers);
    } catch (error: any) {
      console.error('Error fetching users for admin:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
     if (decodedToken.role !== 'SuperAdmin') {
      return res.status(403).json({ error: 'Forbidden: Only SuperAdmins can create new admins.' });
    }
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }
    if (role !== 'Admin') {
      return res.status(400).json({ error: 'Only the "Admin" role can be created.' });
    }

    try {
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      if (existingAdmin) {
        return res.status(409).json({ error: 'An admin with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newAdmin = new Admin({
        email: email.toLowerCase(),
        passwordHash,
        role: 'Admin' as AdminRole,
      });

      await newAdmin.save();
      const { passwordHash: _, ...sanitizedAdmin } = newAdmin.toObject();

      return res.status(201).json(sanitizedAdmin);
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      if (error.name === 'ValidationError') {
          return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
