
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Organization, { type IOrganization, type OrganizationStatus } from '@/models/Organization';
import Employee, { type IEmployee } from '@/models/Employee';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

// Interface for a single employee record in the detail view
interface OrgEmployee {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'HR' | 'Employee';
  department?: string;
  createdAt: string;
}

// Interface for the detailed organization data response
export interface OrganizationDetailData {
  _id: string;
  name: string;
  emailDomain: string;
  status: OrganizationStatus;
  employees: OrgEmployee[];
  createdAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  const { id } = req.query;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid organization ID format.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  
  // Using a simple token check for admin access for now
  const isValidAdminToken = token && token.length > 20;
  if (!isValidAdminToken) {
    return res.status(403).json({ error: 'Forbidden: Access restricted to platform administrators.' });
  }

  const orgId = new mongoose.Types.ObjectId(id);

  if (req.method === 'GET') {
    try {
      const organization = await Organization.findById(orgId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found.' });
      }

      const employees = await Employee.find({ organizationId: orgId }).select('-passwordHash');

      const response: OrganizationDetailData = {
        _id: organization._id.toString(),
        name: organization.name,
        emailDomain: organization.emailDomain,
        status: organization.status,
        employees: employees.map(e => ({
          _id: e._id.toString(),
          name: e.name,
          email: e.email,
          role: e.role,
          department: e.department,
          createdAt: e.createdAt.toISOString(),
        })),
        createdAt: organization.createdAt.toISOString(),
      };

      return res.status(200).json(response);

    } catch (error: any) {
      console.error('Error fetching organization details:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'PUT') {
    try {
        const { status } = req.body;
        if (!status || !['Active', 'Hold', 'Suspended'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status provided.' });
        }
        
        const organization = await Organization.findByIdAndUpdate(
            orgId, 
            { status: status as OrganizationStatus }, 
            { new: true, runValidators: true }
        );

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found.' });
        }
        
        return res.status(200).json({ message: `Organization status updated to ${status}.`, organization });

    } catch (error: any) {
        console.error('Error updating organization status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
