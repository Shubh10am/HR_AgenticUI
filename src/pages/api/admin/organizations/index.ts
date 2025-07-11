
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Organization, { type OrganizationStatus } from '@/models/Organization';
import Employee from '@/models/Employee';
import { verifyToken, type JwtPayload } from '@/lib/jwt';

export interface AdminOrganizationData {
  _id: string;
  name: string;
  emailDomain: string;
  status: OrganizationStatus;
  userCount: number;
  adminName: string;
  createdAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminOrganizationData[] | { error: string }>
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
  
  // For admin panel, we are using a simple token check, not a full JWT.
  // In a production app, this would use a robust JWT verification for admin roles.
  // This mock check is aligned with the admin login flow.
  const isValidAdminToken = token && token.length > 20; // Simple check for a mock token

  if (!isValidAdminToken) {
    return res.status(403).json({ error: 'Forbidden: Access restricted to platform administrators.' });
  }
  
  try {
    const organizations = await Organization.find({}).sort({ createdAt: -1 });

    const organizationsData: AdminOrganizationData[] = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await Employee.countDocuments({ organizationId: org._id });
        const orgAdmin = await Employee.findOne({ organizationId: org._id, role: 'Admin' });

        return {
          _id: org._id.toString(),
          name: org.name,
          emailDomain: org.emailDomain,
          status: org.status,
          userCount,
          adminName: orgAdmin ? orgAdmin.name : 'N/A',
          createdAt: org.createdAt.toISOString(),
        };
      })
    );

    return res.status(200).json(organizationsData);
  } catch (error: any) {
    console.error('Error fetching organizations for admin:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
