
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Organization, { type OrganizationStatus } from '@/models/Organization';
import Employee from '@/models/Employee';
import { requirePlatformAdmin } from '@/lib/platform-admin';

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
  if (!requirePlatformAdmin(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();


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
          status: org.status || 'Active', // If status is missing, default to 'Active'
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
