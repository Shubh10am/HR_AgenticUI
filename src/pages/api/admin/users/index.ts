
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization'; // Import Organization model

export interface AdminUserData {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'HR' | 'Employee';
  organizationName: string;
  createdAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminUserData[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  
  const isValidAdminToken = token && token.length > 20;

  if (!isValidAdminToken) {
    return res.status(403).json({ error: 'Forbidden: Access restricted to platform administrators.' });
  }
  
  try {
    const users = await Employee.find({}).populate('organizationId', 'name').sort({ createdAt: -1 });

    const usersData: AdminUserData[] = users.map(user => {
      // The populated field can be an object or null
      const org = user.organizationId as any; // Cast to any to access name property
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationName: org?.name || 'N/A',
        createdAt: user.createdAt.toISOString(),
      };
    });

    return res.status(200).json(usersData);
  } catch (error: any) {
    console.error('Error fetching users for admin:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
