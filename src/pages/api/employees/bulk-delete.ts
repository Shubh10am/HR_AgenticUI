
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { verifyToken } from '@/lib/jwt';

type BulkDeleteRequestBody = {
  emails: string[];
};

type ResponseData = {
  message: string;
  deletedCount: number;
  failedCount: number;
  errors: { email: string; reason: string }[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken || decodedToken.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Only Admins can perform this action.' });
  }

  const { employeeId: adminId, organizationId } = decodedToken;
  const { emails } = req.body as BulkDeleteRequestBody;

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'An array of employee emails is required.' });
  }

  const deletionErrors: { email: string; reason: string }[] = [];
  const emailsToDelete = emails.map(e => e.toLowerCase());

  // Prevent admin from deleting themselves
  const adminUser = await Employee.findById(adminId);
  if (adminUser && emailsToDelete.includes(adminUser.email.toLowerCase())) {
    return res.status(400).json({ error: 'Cannot delete your own account via bulk delete.' });
  }

  try {
    const result = await Employee.deleteMany({
      organizationId: organizationId,
      email: { $in: emailsToDelete },
    });
    
    const deletedCount = result.deletedCount || 0;
    
    if (deletedCount < emailsToDelete.length) {
      const foundEmployees = await Employee.find({
        organizationId: organizationId,
        email: { $in: emailsToDelete },
      }).select('email').lean();
      
      const foundEmails = new Set(foundEmployees.map(e => e.email));
      
      emailsToDelete.forEach(email => {
        if (!foundEmails.has(email)) {
          deletionErrors.push({ email, reason: 'Employee not found in this organization.' });
        }
      });
    }

    return res.status(200).json({
      message: 'Bulk deletion process completed.',
      deletedCount,
      failedCount: deletionErrors.length,
      errors: deletionErrors,
    });
  } catch (error: any) {
    console.error('Bulk deletion error:', error);
    return res.status(500).json({ error: 'Internal Server Error during bulk deletion.' });
  }
}
