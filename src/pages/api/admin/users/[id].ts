
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Admin, { type IAdmin, type AdminRole } from '@/models/Admin';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();
  
  const { id } = req.query;

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid admin ID format.' });
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

  const { employeeId: currentUserId, role: currentUserRole } = decodedToken;

  // Only SuperAdmins can edit or delete other admins
  if (currentUserRole !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action.' });
  }

  // SuperAdmin cannot edit or delete themselves
  if (currentUserId === id) {
    return res.status(403).json({ error: 'Forbidden: SuperAdmins cannot modify their own account.' });
  }

  if (req.method === 'PUT') {
    const { role } = req.body;
    if (!role || !['Admin', 'SuperAdmin'].includes(role)) {
      return res.status(400).json({ error: 'A valid role is required.' });
    }

    try {
      const adminToUpdate = await Admin.findById(id);
      if (!adminToUpdate) {
        return res.status(404).json({ error: 'Admin not found.' });
      }

      adminToUpdate.role = role as AdminRole;
      await adminToUpdate.save();

      const { passwordHash, ...sanitizedAdmin } = adminToUpdate.toObject();
      return res.status(200).json(sanitizedAdmin);
    } catch (error) {
      console.error('Error updating admin:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const adminToDelete = await Admin.findById(id);
      if (!adminToDelete) {
        return res.status(404).json({ error: 'Admin not found.' });
      }

      await Admin.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Admin deleted successfully.' });
    } catch (error) {
      console.error('Error deleting admin:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
