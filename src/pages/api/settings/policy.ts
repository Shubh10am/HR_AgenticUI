
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import CompanyPolicy, { type PolicyType } from '@/models/CompanyPolicy';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';

const defaultPolicies: Record<PolicyType, string> = {
    attendance: `Working Hours: Standard working hours are 9:00 AM to 5:30 PM, Monday to Friday.
Late Policy: Arrival after 9:15 AM is considered late. More than 3 late marks in a month may affect performance reviews.
Leave Application: All leaves must be applied for at least 3 days in advance, except for emergencies. Sick leave requires a medical certificate for absences longer than 2 days.
Breaks: A total of 1 hour break (lunch and tea) is permitted during the workday.
This is a summary. Please refer to the employee handbook for the complete attendance policy.`,
    leave: `This is the default leave policy. Please update it.`,
    codeOfConduct: `This is the default code of conduct. Please update it.`,
};

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { organizationId, id: employeeId } = req.user;

  if (req.method === 'GET') {
    const { type } = req.query;
    if (!type || typeof type !== 'string' || !['attendance', 'leave', 'codeOfConduct'].includes(type)) {
      return res.status(400).json({ error: 'A valid policy type is required.' });
    }
    const policyType = type as PolicyType;

    try {
      const policy = await CompanyPolicy.findOne({ organizationId, policyType });
      if (policy) {
        return res.status(200).json({ content: policy.content });
      } else {
        return res.status(200).json({ content: defaultPolicies[policyType] });
      }
    } catch (error) {
      console.error('Error fetching policy:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } 
  
  if (req.method === 'PUT') {
    const { policyType, content } = req.body;
    if (!policyType || !content || typeof policyType !== 'string' || !['attendance', 'leave', 'codeOfConduct'].includes(policyType)) {
      return res.status(400).json({ error: 'Policy type and content are required.' });
    }

    try {
      const updatedPolicy = await CompanyPolicy.findOneAndUpdate(
        { organizationId, policyType },
        { content, updatedBy: employeeId },
        { new: true, upsert: true, runValidators: true }
      );
      return res.status(200).json({ message: 'Policy updated successfully.', policy: updatedPolicy });
    } catch (error) {
      console.error('Error updating policy:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } 
  
  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

// Any authenticated user can GET, but only Admin/HR can PUT
export default withAuth((req, res) => {
    if (req.method === 'PUT') {
        const { role } = (req as NextApiRequestWithAuth).user;
        if (role !== 'Admin' && role !== 'HR') {
            return res.status(403).json({ error: 'Forbidden: Only Admins or HR can update policies.' });
        }
    }
    return handler(req as NextApiRequestWithAuth, res);
});
